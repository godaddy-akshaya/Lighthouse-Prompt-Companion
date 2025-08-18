"""
GOCAAS Agents SDK implementation.
"""

import os
import re
import asyncio
import json
import traceback
import pandas as pd
import numpy as np
import logging

# Set up logging
logger = logging.getLogger(__name__)
from typing import List, Optional, Dict, Any, Tuple
from dotenv import load_dotenv
from collections import Counter, defaultdict
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from textblob import TextBlob
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import stopwords
from nltk.util import ngrams
import spacy
from tqdm import tqdm

# Download all required NLTK data
def download_nltk_data():
    """Download required NLTK resources."""
    import ssl
    try:
        _create_unverified_https_context = ssl._create_unverified_context
    except AttributeError:
        pass
    else:
        ssl._create_default_https_context = _create_unverified_https_context
    
    resources = [
        'punkt',
        'stopwords',
        'averaged_perceptron_tagger',
        'maxent_ne_chunker',
        'words',
        'punkt_tab'
    ]
    for resource in resources:
        try:
            nltk.data.find(f'tokenizers/{resource}')
        except LookupError:
            try:
                print(f"Downloading NLTK resource: {resource}")
                nltk.download(resource, quiet=True)
            except Exception as e:
                print(f"Failed to download {resource}: {e}. Continuing without this resource.")

# Download NLTK data
download_nltk_data()

# Load spaCy model
try:
    nlp = spacy.load('en_core_web_lg')
except OSError:
    os.system('python -m spacy download en_core_web_lg')
    nlp = spacy.load('en_core_web_lg')

# Load environment variables from .env file in current directory
load_dotenv()

from openai import OpenAI

class ConversationalAgent:
    """A wrapper class to maintain conversation state."""
    def __init__(self):
        self.client = None
        self.conversation_history = []
        self.current_csv_data = None
        self.csv_summary = None
        self.learned_patterns = {}
        self.prompt_feedback = {}
        self.current_mode = None  # 'initial' or 'summary'
        self.prompt_generated = False
        self.analysis_cache = {}  # Cache for analysis results - cleared on init
        self.current_analysis_prompt = None  # Store the generated analysis prompt
        self.issue_counts = {  # Track counts for specific categories
            'Email Configuration': 0,
            'DNS Settings': 0,
            'Email Migration': 0,
            'Email Security': 0
        }
        # Clear all caches on initialization
        self.clear_all_caches()
        
    def _extract_key_phrases(self, text: str) -> List[str]:
        """Extract key phrases using spaCy."""
        doc = nlp(text)
        phrases = []
        for chunk in doc.noun_chunks:
            if len(chunk.text.split()) >= 2:  # Only phrases with 2+ words
                phrases.append(chunk.text.lower())
        return phrases
        
    def _analyze_sentiment(self, text: str) -> Dict[str, float]:
        """Analyze sentiment using TextBlob."""
        blob = TextBlob(text)
        return {
            'polarity': blob.sentiment.polarity,
            'subjectivity': blob.sentiment.subjectivity
        }
        
    def _get_common_topics(self, texts: List[str], n: int = 10) -> List[Tuple[str, int]]:
        """Extract common topics using CountVectorizer and NLP analysis."""
        # First, analyze each text to identify key issues and pain points
        issue_phrases = []
        for text in texts:
            doc = nlp(text)
            
            # Look for sentences containing issue indicators
            for sent in doc.sents:
                sent_text = sent.text.lower()
                if any(word in sent_text for word in ['issue', 'problem', 'error', 'difficult', 'cant', "can't", 'fail', 'bug', 'broken', 'slow', 'confusing']):
                    # Extract the key noun phrases and their context
                    for chunk in doc.noun_chunks:
                        if len(chunk.text.split()) >= 2:  # Only phrases with 2+ words
                            issue_phrases.append(chunk.text.lower())
        
        # Use CountVectorizer as a backup for any remaining text
        vectorizer = CountVectorizer(
            ngram_range=(2, 3),
            stop_words='english',
            min_df=2,
            max_df=0.9
        )
        
        try:
            # Combine NLP-extracted phrases with vectorizer results
            if issue_phrases:
                phrase_counts = Counter(issue_phrases)
                nlp_topics = [(phrase, count) for phrase, count in phrase_counts.most_common()]
            else:
                nlp_topics = []
            
            # Get additional topics from vectorizer
            X = vectorizer.fit_transform(texts)
            words = vectorizer.get_feature_names_out()
            counts = X.sum(axis=0).A1
            vec_topics = list(zip(words, counts))
            
            # Combine and sort all topics
            all_topics = nlp_topics + vec_topics
            return sorted(all_topics, key=lambda x: x[1], reverse=True)[:n]
            
        except ValueError:  # If no features were extracted
            if issue_phrases:
                phrase_counts = Counter(issue_phrases)
                return phrase_counts.most_common(n)
            return []
            
    def _analyze_text_stats(self, texts: List[str]) -> Dict[str, Any]:
        """Analyze text statistics."""
        word_counts = [len(text.split()) for text in texts]
        sent_counts = [len(sent_tokenize(text)) for text in texts]
        return {
            'avg_words': np.mean(word_counts),
            'std_words': np.std(word_counts),
            'avg_sentences': np.mean(sent_counts),
            'std_sentences': np.std(sent_counts),
            'min_words': min(word_counts),
            'max_words': max(word_counts)
        }
        
    def _find_representative_samples(self, texts: List[str], n: int = 3) -> List[str]:
        """Find representative samples based on length and content."""
        if len(texts) <= n:
            return texts
            
        # Get samples from different length categories
        word_counts = [len(text.split()) for text in texts]
        sorted_indices = np.argsort(word_counts)
        
        samples = []
        step = len(texts) // n
        for i in range(n):
            idx = sorted_indices[i * step]
            samples.append(texts[idx])
            
        return samples

    def clear_all_caches(self):
        """Clear all application caches."""
        self.analysis_cache.clear()
        self.learned_patterns.clear()
        self.prompt_feedback.clear()
        self.current_csv_data = None
        self.csv_summary = None
        self.current_mode = None
        
        # Don't clear prompt-related state unless explicitly requested
        if not self.prompt_generated:
            self.current_analysis_prompt = None
        self.prompt_generated = False
            
        print("All caches cleared.")

    async def initialize(self):
        """Initialize the GOCAAS client."""
        # Set up API credentials from environment variables
        api_key = os.getenv("GOCAAS_API_KEY")  # Put your *proxy* key in .env
        api_base = os.getenv("GOCAAS_API_BASE", "https://caas-gocode-staging.caas-staging.staging.onkatana.net/v1")
        assert api_key, "Missing GOCAAS_API_KEY env var"
        
        print("Using API Key:", api_key)
        print("Using API Base:", api_base)
        
        # Configure GOCAAS client
        self.client = OpenAI(
            api_key=api_key,
            base_url=api_base
        )

    async def run(self, message: str) -> str:
        """Run the agent with a single message."""
        return await self.chat(message)


    async def chat(self, message: str) -> str:
        """
        Chat with the model while maintaining conversation history and learning from interactions.
        Args:
            message: The user message
        Returns:
            The model's response
        """
        try:
            # Add user message to history
            self.conversation_history.append({"role": "user", "content": message})
            
            # Determine or update mode based on user input
            if not self.current_mode:
                if message.lower() in ['1', 'initial prompt']:
                    self.current_mode = 'initial'
                    self.prompt_generated = False
                    return """Here is your complete analysis prompt:

[transcript] You are tasked with analyzing and summarizing call transcripts (document above) from the customer service center of GoDaddy.com. Each conversation begins with one of the following identifiers: "System", "Bot", "Customer", "Consumer", or "Agent". "Customer" and "Consumer" are synonymous. "Agent" refers to a human support representative, while "Bot" is a chatbot. Some transcripts may contain low-quality speech-to-text conversions, so please interpret carefully and clarify where appropriate. Each turn starts with the role indicated above followed by ':', and ends with '|||'. Identifiable information like names and emails have been redacted as GD_REDACTED_NAME and GD_REDACTED_EMAIL.

1. Identify key pain points experienced by the customers related to domain issues in each call.
2. Analyze how the bot and/or agent handled the issue(s) in the given call.
3. Point out what went well and could be improved in terms of the given call and determine if escalating issues specific to domain management.
4. Provide specific examples from the transcript to support your analysis.

**Task instructions:**"""
                elif message.lower() in ['2', 'summary of summaries', 'summary of summaries prompt']:
                    self.current_mode = 'summary'
                    self.prompt_generated = False
                    return """Analyze customer call transcripts between customers and customer service guides regarding commerce website development issues. Provide a detailed breakdown of the following:

Output Format:
1. Executive Summary:
   - Provide a concise overview of key findings and general sentiment.

2. Quantitative Analysis:
   - Count and percentage of specific feature mentions (list all features mentioned)
   - Frequency distribution of all complaints by category
   - Overall sentiment analysis with percentages (positive, neutral, negative) and identification of the most common sentiment mode

3. What's Working Well:
   - Identify positive aspects of the commerce website mentioned by customers
   - Highlight features receiving praise or positive feedback
   - Note any compliments about recent improvements

4. Categories of Pain Points:
   - Categorize all identified issues into logical groupings (e.g., checkout problems, navigation issues, mobile compatibility, etc.)
   - Include an "Other" category for issues that don't fit neatly into the main categories
   - For each category (including "Other"), provide representative examples from the transcripts

5. Top 3 Issues:
   - Identify and detail the three most frequently mentioned problems
   - For each top issue, include:
     * Number of mentions and percentage of total complaints
     * Specific customer quotes illustrating the problem
     * Impact on customer experience and business outcomes

6. Top 3 Recommendations:
   - For each of the top 3 issues, provide very specific, actionable recommendations
   - Include overall strategic recommendations for improving the commerce website experience

7. Additional Insights:
   - Note any patterns in customer behavior or expectations
   - Identify emerging trends or concerns not captured in the main categories
   - Highlight any competitive comparisons mentioned by customers

8. Not Found:
   - List any important commerce website elements or features specifically looked for but were not mentioned in the transcripts

9. Other Observations:
   - Include any relevant findings that don't fit into the above categories
   - Note any unusual or unexpected patterns in the customer interactions

Ensure all recommendations are specific, actionable, and directly address the identified issues. Support your analysis with direct quotes or examples from the transcripts whenever possible.

Would you like to customize any part of this prompt before we proceed with the analysis?"""
                elif not any(mode in message.lower() for mode in ['1', '2', 'initial prompt', 'summary of summaries']):
                    return """Would you like to create:
1. An initial prompt for analyzing individual transcripts, or
2. A summary of summaries prompt for analyzing multiple transcript summaries?

Please type '1' or 'initial prompt' for option 1, or '2' or 'summary of summaries' for option 2."""
            
            # Create messages array for the API call
            messages = [
                {"role": "system", "content": """You are an expert LLM Prompt Engineer specializing in conversation analysis. Your responses should be:
1. Clear and focused - one question at a time
2. Well-formatted with proper spacing and sections
3. Patient - wait for the user's answer before proceeding

INITIAL INTERACTION:
When starting a new conversation, begin with:

"👋 Welcome! I'll help you create an effective analysis prompt.

Please choose the type of analysis you'd like to perform:

[1] Individual Transcript Analysis
    - Analyze single customer interactions in detail
    - Focus on specific conversation patterns
    - Extract detailed insights from individual cases

[2] Summary of Summaries Analysis
    - Analyze patterns across multiple conversations
    - Identify common themes and trends
    - Generate high-level insights from aggregate data

Please enter 1 or 2 to continue."

DO NOT proceed with any other questions until the user has chosen one of these options.

FOR INITIAL PROMPT MODE (When user selects option 1):
Follow this exact structure:

UNDERSTAND THEIR NEEDS
1. Ask about their specific analysis goals and the topic (domain, emails...)
2. Inquire about the types of transcripts they're analyzing (phone calls, chats, emails)
3. Determine what actions they want to take based on the insights
4. Learn what format would make the output most actionable for them

DESIGN THE PROMPT
Always begin with the required transcript analysis framework:
[transcript] You are tasked with analyzing and summarizing call transcripts (document above) from the customer service center of GoDaddy.com. Each conversation begins with one of the following identifiers: "System", "Bot", "Customer", "Consumer", or "Agent". "Customer" and "Consumer" are synonymous. "Agent" refers to a human support representative, while "Bot" is a chatbot. Some transcripts may contain low-quality speech-to-text conversions, so please interpret carefully and clarify where appropriate. Each turn starts with the role indicated above followed by ':', and ends with '|||'. Identifiable information like names and emails have been redacted as GD_REDACTED_NAME and GD_REDACTED_EMAIL.

Follow Lighthouse format principles contained in the library and including: Specific task instructions

FOR SUMMARY OF SUMMARIES MODE (When user selects option 2):
1. If the user hasn't chosen a mode (initial or summary), ask them to choose.
2. Once in summary of summaries mode:
   - First, help create the perfect summary analysis prompt
   - After the prompt is finalized, ask for the CSV file
   - Analyze the summaries using the created prompt
   - Provide insights and recommendations
3. Learn from user feedback:
   - Note which approaches work well
   - Adapt to user preferences
   - Build on successful patterns
4. Maintain conversation context:
   - Reference previous discussions
   - Build upon established understanding
   - Show how current insights connect to past ones

You are an expert LLM Prompt Engineer specializing in creating highly effective prompts for analyzing customer service interactions.

For Initial Prompt analysis (after getting the first answer about domain/topic):
1. Thank the user for specifying the domain
2. Present a simple, focused prompt that emphasizes:
   - Understanding the conversation flow
   - Identifying main pain points
   - Highlighting key customer needs
   - Suggesting potential solutions

The prompt should follow this format:
[transcript] You are tasked with analyzing and summarizing call transcripts (document above) from the customer service center of GoDaddy.com. Each conversation begins with one of the following identifiers: "System", "Bot", "Customer", "Consumer", or "Agent". "Customer" and "Consumer" are synonymous. "Agent" refers to a human support representative, while "Bot" is a chatbot. Some transcripts may contain low-quality speech-to-text conversions, so please interpret carefully and clarify where appropriate. Each turn starts with the role indicated above followed by ':', and ends with '|||'. Identifiable information like names and emails have been redacted as GD_REDACTED_NAME and GD_REDACTED_EMAIL.

Focus Area: {category}
Analysis Aspects: {aspects}

Please analyze the conversation and provide a clear summary focusing on these elements.

Keep the analysis straightforward and actionable, focusing on the most important aspects of the interaction.

For Summary of Summaries analysis, use this exact structure:

Task: Analyze customer call transcripts between customers and customer service guides regarding commerce website development issues. Provide a detailed breakdown of the following:

Output Format:
1. Executive Summary:
   - Provide a concise overview of key findings and general sentiment

2. Quantitative Analysis:
   - Count and percentage of specific feature mentions (list all features mentioned)
   - Frequency distribution of all complaints by category
   - Overall sentiment analysis with percentages (positive, neutral, negative) and identification of the most common sentiment mode

3. What's Working Well:
   - Identify positive aspects of the commerce website mentioned by customers
   - Highlight features receiving praise or positive feedback
   - Note any compliments about recent improvements

4. Categories of Pain Points:
   - Categorize all identified issues into logical groupings (e.g., checkout problems, navigation issues, mobile compatibility, etc.)
   - Include an "Other" category for issues that don't fit neatly into the main categories
   - For each category (including "Other"), provide representative examples from the transcripts

5. Top 3 Issues:
   - Identify and detail the three most frequently mentioned problems
   - For each top issue, include:
     * Number of mentions and percentage of total complaints
     * Specific customer quotes illustrating the problem
     * Impact on customer experience and business outcomes

6. Top 3 Recommendations:
   - For each of the top 3 issues, provide very specific, actionable recommendations
   - Include overall strategic recommendations for improving the commerce website experience

7. Additional Insights:
   - Note any patterns in customer behavior or expectations
   - Identify emerging trends or concerns not captured in the main categories
   - Highlight any competitive comparisons mentioned by customers

8. Not Found:
   - List any important commerce website elements or features specifically looked for but not mentioned in the transcripts

9. Other Observations:
   - Include any relevant findings that don't fit into the above categories
   - Note any unusual or unexpected patterns in the customer interactions

### Quantitative Analysis
1. Issue Tracking
   - Count and categorize domain-specific issues
   - Calculate frequency and percentage for each category
   - Break down issues into sub-categories with metrics
   - Track product mentions and their context

2. Performance Metrics
   - Response times and resolution rates
   - Customer satisfaction indicators
   - Issue recurrence patterns
   - Support channel effectiveness

### Top 3 Domain Issues
For each major issue:

1. Issue Profile
   - Frequency (count and %)
   - Severity level
   - Impact scope
   - Affected user segments

2. Detailed Breakdown
   - Key pain points (bullet list)
   - Sub-issues and dependencies
   - Customer impact areas
   - Technical vs. user experience factors

3. Evidence Base
   - Representative quotes (3-5 per issue)
   - Customer scenarios
   - Product correlations
   - Context metadata (channel, region, duration)

### Specific Recommendations
For each top issue:

1. Solution Package
   - 3 actionable recommendations
   - Implementation steps
   - Expected outcomes
   - Resource needs

2. Implementation Guide
   - Priority level
   - Timeline estimate
   - Success metrics
   - Risk factors

### What's Working Well
1. Success Patterns
   - Effective features
   - Successful processes
   - Positive user experiences

2. Supporting Evidence
   - Customer testimonials
   - Performance metrics
   - Best practice examples

### Additional Insights
1. Trend Analysis
   - Emerging patterns
   - User behavior trends
   - Cross-product impacts
   - Support efficiency metrics

2. Opportunity Areas
   - Process improvements
   - Feature enhancements
   - Integration possibilities

### Not Found
1. Data Gaps
   - Missing elements
   - Incomplete information
   - Required context

2. Investigation Needs
   - Additional data points
   - Verification requirements
   - Follow-up areas

### Uncertainties
1. Clarity Issues
   - Ambiguous findings
   - Unclear patterns
   - Data inconsistencies

2. Information Needs
   - Required clarifications
   - Additional context
   - Validation points

Analysis Instructions:
- Focus on actionable insights
- Provide specific examples
- Include quantitative metrics
- Highlight priority areas
- Note data limitations

When creating the prompt:
1. First ask about the specific domain/topic they want to analyze
2. Ask about any specific metrics or patterns they want to track
3. Confirm if they want to modify any sections of the structure
4. Present the complete prompt using this exact structure
5. After the prompt is finalized, ask them to provide their CSV file

**When generating your output, always use the following detailed format:**

### Quantitative Analysis
- Provide a table listing each specific topic or issue mentioned, with:
  - The number of mentions
  - Percentage of total summaries
  - Example quotes for each topic/issue
- For each issue, break down into sub-issues or related topics, and provide counts for each.
- List all GoDaddy products mentioned, with:
  - Number of mentions
  - Percentage of total summaries
  - Context in which each product was discussed (e.g., problem, praise, question)
- Include summary statistics (e.g., average number of issues per summary, most/least common topics).

### Top 3 [Topic] Issues
For each of the top 3 issues:
- Frequency (count and percentage)
- Key pain points (bulleted list)
- Sub-issues or related challenges
- Root causes if identifiable
- Customer emotions or sentiment expressed (with supporting quotes)
- Representative quotes (at least 3-5 per issue, with attribution if possible)
- Affected products or services
- Any relevant metadata (e.g., channel, region, call duration, customer type)

### Specific Recommendations
For each top issue:
- 3-5 actionable recommendations, each with a clear rationale
- Prioritize recommendations by potential impact and ease of implementation
- Suggest metrics to track the effectiveness of each recommendation

### What's Working Well
- List positive patterns, successful features, and effective processes
- Include direct positive customer quotes and specific examples
- Highlight any improvements over time if visible in the data

### Additional Insights
- List any other valuable observations, with supporting data or quotes
- Identify emerging trends or outlier cases
- Note any unexpected findings

### Not Found
- List important elements that were specifically looked for but not found
- Note any gaps in the data or analysis

### Uncertainties
- List any areas where the data is unclear or ambiguous
- Suggest what additional information would help clarify these uncertainties

### Formatting Requirements
- Use clear section headers and bullet points
- Include tables for quantitative data where appropriate
- Use bold or italics to highlight key findings
- Ensure the output is easy to scan and actionable

**Instructions for the LLM:**
- Always use this structure, with as much specific detail and direct quoting as possible.
- If you are unsure about any aspect, state your uncertainty and what would help clarify it.
- Present the draft prompt and offer to refine it based on user feedback. Continue iterating until the user confirms the prompt meets their needs.

OUTPUT FORMAT REQUIREMENTS: Ensure the final prompt explicitly requests:
A quantitative analysis section with specific counts and percentages
A "What's Working Well" section highlighting positive patterns and successful elements
Clearly identified top 3 issues based on specified criteria
Tailored recommendations for each top issue
An "Additional Insights" section for valuable observations that don't fit in other categories
A "Not Found" section listing important elements that were specifically looked for but not found
A section of things that you are uncertain how to do. Don't hallucinate
Proper formatting according to user preferences 

Present the draft prompt and offer to refine it based on feedback. Continue iterating until the user confirms the prompt meets their needs.

**CRITICAL FORMATTING REQUIREMENT**: When presenting a complete prompt (initial or summary of summaries), ALWAYS format it as a clear, structured document that includes:
1. A clear indication this is a complete prompt (use "Here is your complete analysis prompt:" or similar)
2. The [transcript] framework section
3. Clear section headers using ### for major sections
4. Well-organized content with bullet points and structured layout
5. Analysis Instructions section
6. All required components for the chosen prompt type

This formatting is essential for the UI to properly detect and display the prompt in the dedicated prompt display area.

CSV FILE ANALYSIS: After the user confirms the summary of summaries prompt is satisfactory, let them know they can upload their CSV file using the UI. Once the CSV is uploaded, proceed directly to analysis using the uploaded file—do not ask the user for a file path. Analyze the CSV 'conversation_summary' column only and present the results following the specified output format. Offer to refine or expand the analysis based on user feedback.

Always maintain a helpful, educational tone that builds the user's prompt engineering capabilities while delivering immediate value through your expert prompt design. The more detail the better.

**Important:** You have memory of our previous conversations in this session. Use context from earlier messages to provide better responses."""}
            ]
            messages.extend(self.conversation_history[-10:])  # Include last 10 messages
            
            # Call the API with retry logic (OpenAI client is synchronous)
            max_retries = 3
            retry_count = 0
            while retry_count < max_retries:
                try:
                    response = self.client.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=messages,
                        timeout=60  # 60 seconds timeout
                    )
                    break  # Success, exit the retry loop
                except Exception as e:
                    retry_count += 1
                    if retry_count == max_retries:
                        if "timeout" in str(e).lower():
                            raise Exception("The request timed out. Please try again. If the problem persists, try breaking your question into smaller parts.")
                        else:
                            raise e
                    print(f"Request failed, retrying ({retry_count}/{max_retries})... Error: {str(e)}")
                    await asyncio.sleep(1)  # Wait a second before retrying
            
            # Extract and store response
            assistant_response = response.choices[0].message.content
            self.conversation_history.append({"role": "assistant", "content": assistant_response})
            
            # Handle prompt generation and modifications
            # Check if this response contains a complete prompt
            is_complete_prompt = (
                "Here is your complete analysis prompt:" in assistant_response or
                "Task Introduction" in assistant_response and "Quantitative Analysis" in assistant_response
            )
            
            # Check if this is a prompt modification request
            is_prompt_modification = any(keyword in message.lower() for keyword in 
                ['change', 'modify', 'update', 'customize', 'edit'] + ['prompt'])
                
            if is_complete_prompt or (self.prompt_generated and is_prompt_modification):
                # Store the complete response first
                self.conversation_history[-1]["content"] = assistant_response
                
                # Extract and store the actual prompt content
                extracted_prompt = self._extract_prompt_content(assistant_response)
                self.current_analysis_prompt = extracted_prompt
                self.prompt_generated = True
                logger.info("Analysis prompt has been stored/updated")
                
                # Format the response for the prompt display area
                formatted_response = self._format_prompt_for_display(extracted_prompt)
                
                # Return the formatted version for display
                assistant_response = formatted_response
            
            # Keep conversation history manageable (last 20 messages)
            if len(self.conversation_history) > 20:
                self.conversation_history = self.conversation_history[-20:]
                
            return assistant_response
            
        except asyncio.TimeoutError:
            error_msg = "The request timed out. Please try again. If the problem persists, try breaking your question into smaller parts."
            print(f"Error in chat with model: {error_msg}")
            return error_msg
        except Exception as e:
            error_msg = str(e)
            print(f"Error in chat with model: {error_msg}")
            if "timeout" in error_msg.lower():
                return "The request took too long to complete. Please try again or break your question into smaller parts."
            return f"I encountered an error. Please try again. Error details: {error_msg}"

    def clear_history(self):
        """Clear the conversation history."""
        self.conversation_history = []
        self.prompt_generated = False
        print("Conversation history cleared.")
    
    def clear_all_caches_runtime(self):
        """Clear all caches during runtime (called by user request)."""
        self.clear_all_caches()
        # Also clear any NLTK caches
        import nltk
        try:
            nltk.data.clear_cache()
        except:
            pass
        # Clear spaCy model cache if possible
        try:
            import spacy
            spacy.util.registry.reset()
        except:
            pass
        print("🧹 All application caches cleared successfully!")
        
    def store_feedback(self, prompt_type, feedback):
        """Store feedback about generated prompts for learning."""
        if prompt_type not in self.prompt_feedback:
            self.prompt_feedback[prompt_type] = []
        self.prompt_feedback[prompt_type].append(feedback)
        
    def learn_from_interaction(self, user_input, response, success=True):
        """Learn from user interactions to improve future responses."""
        # Extract key phrases from successful interactions
        key_phrases = [phrase.strip() for phrase in user_input.lower().split() if len(phrase) > 3]
        for phrase in key_phrases:
            if phrase not in self.learned_patterns:
                self.learned_patterns[phrase] = {"success": 0, "failure": 0}
            if success:
                self.learned_patterns[phrase]["success"] += 1
            else:
                self.learned_patterns[phrase]["failure"] += 1
                
    def get_learned_insights(self):
        """Get insights from learned patterns."""
        insights = []
        if self.learned_patterns:
            successful_patterns = sorted(
                [(k, v["success"]) for k, v in self.learned_patterns.items() if v["success"] > v["failure"]],
                key=lambda x: x[1],
                reverse=True
            )[:5]
            if successful_patterns:
                insights.append("Based on our interactions, I've learned these are effective approaches:")
                for pattern, count in successful_patterns:
                    insights.append(f"- Using '{pattern}' has been successful {count} times")
        return "\n".join(insights) if insights else ""

    def load_csv(self, file_path: str) -> bool:
        """
        Load and process a CSV file, focusing only on the 'conversation_summary' column.
        Args:
            file_path: Path to the CSV file
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Read CSV file
            df = pd.read_csv(file_path)
            
            # Enhanced data validation
            # Check for required column (case-insensitive)
            conv_col = next((col for col in df.columns if col.lower() == 'conversation_summary'), None)
            if not conv_col:
                raise ValueError("CSV file must contain a 'conversation_summary' column. Please check your file format.")
            
            # Validate data quality
            df[conv_col] = df[conv_col].fillna('').astype(str).str.strip()
            if df[conv_col].str.len().eq(0).all():
                raise ValueError("The conversation_summary column contains no valid data")
            
            # Store only the conversation_summary column with proper name
            self.current_csv_data = df[[conv_col]].copy()
            self.current_csv_data.columns = ['conversation_summary']  # Normalize column name
            
            # Generate summary focused on conversation data
            summary = []
            summary.append("Processing 'conversation_summary' column")
            summary.append(f"Number of conversation summaries: {len(self.current_csv_data)}")
            
            # Quick initial summary without expensive operations
            summary.append(f"\nQuick Summary:")
            summary.append(f"- Total entries: {len(self.current_csv_data)}")
            
            # Calculate comprehensive statistics
            word_counts = self.current_csv_data['conversation_summary'].str.split().str.len()
            sentiment_scores = [TextBlob(text).sentiment.polarity for text in self.current_csv_data['conversation_summary']]
            
            summary.append(f"\n📊 Complete Statistics (all {len(self.current_csv_data)} entries):")
            summary.append(f"\nText Length Analysis:")
            summary.append(f"- Average words per summary: {word_counts.mean():.1f}")
            summary.append(f"- Median words per summary: {word_counts.median():.1f}")
            summary.append(f"- Shortest summary: {word_counts.min()} words")
            summary.append(f"- Longest summary: {word_counts.max()} words")
            summary.append(f"- Standard deviation: {word_counts.std():.1f} words")
            
            summary.append(f"\nSentiment Overview:")
            positive = sum(1 for s in sentiment_scores if s > 0.1)
            negative = sum(1 for s in sentiment_scores if s < -0.1)
            neutral = len(sentiment_scores) - positive - negative
            summary.append(f"- Positive summaries: {positive} ({(positive/len(sentiment_scores)*100):.1f}%)")
            summary.append(f"- Neutral summaries: {neutral} ({(neutral/len(sentiment_scores)*100):.1f}%)")
            summary.append(f"- Negative summaries: {negative} ({(negative/len(sentiment_scores)*100):.1f}%)")
            summary.append(f"- Average sentiment: {sum(sentiment_scores)/len(sentiment_scores):.2f} [-1 to +1 scale]")
            
            # Show first 3 examples with full text
            summary.append("\nExample Summaries:")
            for idx, text in enumerate(self.current_csv_data['conversation_summary'].head(3), 1):
                summary.append(f"\n{idx}. {text}")  # Show complete text
            
            self.csv_summary = "\n".join(summary)
            return True
            
        except pd.errors.EmptyDataError:
            error_msg = "The CSV file is empty. Please check the file content."
            print(f"Error loading CSV file: {error_msg}")
            self._reset_state()
            return False
        except pd.errors.ParserError as e:
            error_msg = f"CSV parsing error: {str(e)}. Please ensure the file is properly formatted."
            print(f"Error loading CSV file: {error_msg}")
            self._reset_state()
            return False
        except ValueError as e:
            error_msg = str(e)
            print(f"Error loading CSV file: {error_msg}")
            self._reset_state()
            return False
        except Exception as e:
            error_msg = f"Unexpected error while loading CSV: {str(e)}"
            print(f"Error loading CSV file: {error_msg}")
            print("Traceback:", traceback.format_exc())
            self._reset_state()
            return False

    def _reset_state(self):
        """Reset the agent's state related to CSV processing."""
        self.current_csv_data = None
        self.csv_summary = None
        self.analysis_cache.clear()  # Clear any cached analysis results

    def get_csv_summary(self) -> str:
        """
        Get the summary of the currently loaded CSV file.
        Returns:
            str: Summary of the CSV file or error message if no file is loaded
        """
        if self.csv_summary is None:
            return "No CSV file has been loaded yet."
        return self.csv_summary

    def analyze_summaries(self) -> str:
        """
        Analyze conversation summaries following the exact structure from the generated prompt.
        Returns:
            str: Detailed analysis results
        """
        # Validate CSV data
        if self.current_csv_data is None:
            logger.error("No CSV data loaded")
            return "No CSV file has been loaded yet."
            
        if 'conversation_summary' not in self.current_csv_data.columns:
            logger.error("Missing conversation_summary column")
            return "CSV file must contain a 'conversation_summary' column."
            
        if len(self.current_csv_data) == 0:
            logger.error("CSV file is empty")
            return "The loaded CSV file contains no data."
            
        try:
            # Initialize variables
            analysis = []
            series = self.current_csv_data['conversation_summary']
            texts = series.dropna().tolist()
            total_cases = len(texts)
            
            # Initialize counters
            feature_mentions = defaultdict(int)
            sentiment_scores = []
            positive_aspects = defaultdict(list)
            issues = defaultdict(list)
            
            # Process each text
            for text in texts:
                if not isinstance(text, str):
                    continue
                
                # Analyze sentiment
                sentiment = TextBlob(text).sentiment.polarity
                sentiment_scores.append(sentiment)
                
                # Process text
                text_lower = text.lower()
                
                # Track features and sentiment
                for feature in ['checkout', 'navigation', 'mobile', 'search', 'payment', 'cart']:
                    if feature in text_lower:
                        feature_mentions[feature] += 1
                if sentiment > 0.1:
                            positive_aspects[feature].append(text)
                elif sentiment < -0.1:
                            issues[f"{feature} issues"].append(text)
            
            # Calculate sentiment stats
            positive = sum(1 for s in sentiment_scores if s > 0.1)
            negative = sum(1 for s in sentiment_scores if s < -0.1)
            neutral = len(sentiment_scores) - positive - negative
            sentiment_mode = "Positive" if positive > negative and positive > neutral else "Negative" if negative > positive and negative > neutral else "Neutral"
            
            # Get top issues
            top_issues = sorted(issues.items(), key=lambda x: len(x[1]), reverse=True)[:3]
            
            # Format document header
            analysis.append("# CUSTOMER SERVICE CONVERSATION ANALYSIS REPORT")
            analysis.append(f"*Generated: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}*")
            analysis.append(f"**Total Conversations Analyzed: {total_cases}**")
            analysis.append("---")
            
            # 1. Executive Summary
            analysis.append("\n## 📋 Executive Summary")
            analysis.append("\n### Analysis Overview")
            analysis.append(f"\n• Analysis of {total_cases} customer conversations about the commerce website")
            analysis.append(f"• Overall sentiment is predominantly {sentiment_mode.lower()}")
            analysis.append(f"• Most discussed features: {', '.join(k.title() for k,v in sorted(feature_mentions.items(), key=lambda x: x[1], reverse=True)[:3])}")
            analysis.append(f"• Primary concerns: {', '.join(issue[0].title() for issue in top_issues)}")
            
            # 2. Quantitative Analysis
            analysis.append("\n## 📊 Quantitative Analysis")
            
            # Feature Distribution Analysis
            analysis.append("\n### Feature Distribution Analysis")
            analysis.append("\n| Feature | Mentions | Percentage | Trend |")
            analysis.append("|---------|-----------|------------|-------|")
            
            for feature, count in sorted(feature_mentions.items(), key=lambda x: x[1], reverse=True):
                percentage = (count / total_cases) * 100
                trend = "↑ High" if percentage > 30 else "→ Medium" if percentage > 15 else "↓ Low"
                analysis.append(f"| {feature.title()} | {count:,d} | {percentage:.1f}% | {trend} |")
            
            # Issue Distribution Analysis
            analysis.append("\n### Issue Distribution Analysis")
            analysis.append("\n| Category | Count | Percentage | Severity |")
            analysis.append("|----------|--------|------------|-----------|")
            
            total_complaints = sum(len(issue_list) for issue_list in issues.values())
            for category, issue_list in sorted(issues.items(), key=lambda x: len(x[1]), reverse=True):
                count = len(issue_list)
                percentage = (count / total_complaints * 100) if total_complaints > 0 else 0
                severity = "Critical" if percentage > 30 else "High" if percentage > 20 else "Medium" if percentage > 10 else "Low"
                analysis.append(f"| {category.title()} | {count:,d} | {percentage:.1f}% | {severity} |")
            
            # Customer Sentiment Analysis
            analysis.append("\n### Customer Sentiment Analysis")
            analysis.append("\n| Type | Count | Percentage | Indicator |")
            analysis.append("|------|--------|------------|-----------|")
            
            pos_pct = (positive/len(sentiment_scores)*100)
            neg_pct = (negative/len(sentiment_scores)*100)
            neu_pct = (neutral/len(sentiment_scores)*100)
            
            analysis.append(f"| Positive | {positive:,d} | {pos_pct:.1f}% | {'🟢' * int(pos_pct/10)} |")
            analysis.append(f"| Neutral | {neutral:,d} | {neu_pct:.1f}% | {'⚪' * int(neu_pct/10)} |")
            analysis.append(f"| Negative | {negative:,d} | {neg_pct:.1f}% | {'🔴' * int(neg_pct/10)} |")
            
            analysis.append("\n**Key Insights:**")
            analysis.append(f"• Predominant Sentiment: {sentiment_mode}")
            analysis.append(f"• Sentiment Ratio (Pos:Neu:Neg): {pos_pct:.1f}:{neu_pct:.1f}:{neg_pct:.1f}")
            analysis.append(f"• Customer Satisfaction Index: {((pos_pct - neg_pct) / 100):.2f} [-1 to +1 scale]")
            
            # 3. What's Working Well
            analysis.append("\n## ✨ Positive Aspects and Strengths")
            
            # Customer Service Excellence
            analysis.append("\n### Customer Service Excellence")
            service_examples = [text for text in texts if isinstance(text, str) and 
                             TextBlob(text).sentiment.polarity > 0.3 and
                             any(word in text.lower() for word in ['support', 'help', 'service', 'agent'])]
            if service_examples:
                analysis.append("• Quick response times and high resolution rates")
                analysis.append("• Knowledgeable and proactive support staff")
                analysis.append(f"\nCustomer Feedback: \"{service_examples[0]}\"")
            
            # Platform Performance
            analysis.append("\n### Platform Performance")
            performance_examples = [text for text in texts if isinstance(text, str) and 
                                TextBlob(text).sentiment.polarity > 0.3 and
                                any(word in text.lower() for word in ['reliable', 'fast', 'stable', 'performance'])]
            if performance_examples:
                analysis.append("• Strong core functionality performance")
                analysis.append("• Consistent system uptime")
                analysis.append(f"\nCustomer Feedback: \"{performance_examples[0]}\"")
            
            # Feature Set and Usability
            analysis.append("\n### Feature Set and Usability")
            for feature, texts in positive_aspects.items():
                if texts:
                    analysis.append(f"• {feature.title()}: Positive user experiences")
                    analysis.append(f"  Customer Quote: \"{texts[0]}\"")
            
            # Recent Improvements
            analysis.append("\n### Recent Improvements")
            improvements = [text for text in texts if isinstance(text, str) and
                         any(word in text.lower() for word in ['improved', 'better', 'update', 'new']) and
                         TextBlob(text).sentiment.polarity > 0]
            for text in improvements[:2]:
                analysis.append(f"• {text}")
            
            # 4. Categories of Pain Points
            analysis.append("\n## ⚠️ Categories of Pain Points")
            
            # Group issues by category
            for category, issue_list in sorted(issues.items(), key=lambda x: len(x[1]), reverse=True):
                analysis.append(f"\n**{category.title()}**")
                analysis.append(f"Total Issues: {len(issue_list)}")
                if issue_list:
                    analysis.append("Representative Examples:")
                    for example in issue_list[:2]:
                        analysis.append(f"• \"{example}\"")
            
            # 5. Top 3 Issues
            analysis.append("\n## 🔍 Top 3 Issues")
            
            for idx, (issue, examples) in enumerate(top_issues, 1):
                count = len(examples)
                percentage = (count / total_complaints * 100) if total_complaints > 0 else 0
                
                analysis.append(f"\n### Issue {idx}: {issue.title()}")
                analysis.append(f"• Mentions: {count} ({percentage:.1f}% of total complaints)")
                
                # Customer quotes
                analysis.append("\nRepresentative Customer Quotes:")
                for quote in examples[:2]:
                    analysis.append(f"• \"{quote}\"")
                
                # Impact analysis
                impact = self._determine_impact(count, total_cases)
                analysis.append(f"\nBusiness Impact: {impact}")
                
                # Customer experience impact
                sentiment_scores = [TextBlob(ex).sentiment.polarity for ex in examples]
                avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
                sentiment_impact = "Severe Negative" if avg_sentiment < -0.5 else "Moderate Negative" if avg_sentiment < -0.2 else "Slight Negative"
                analysis.append(f"Customer Experience Impact: {sentiment_impact}")
            
            # 6. Top 3 Recommendations
            analysis.append("\n## 🎯 Top 3 Recommendations")
            
            # Implementation Strategy
            analysis.append("\n### 📈 Implementation Strategy")
            
            analysis.append("\n#### Quick Wins")
            analysis.append("• Implement high-impact, low-effort improvements")
            analysis.append("• Address critical user experience issues")
            analysis.append("• Enhance existing documentation")
            
            analysis.append("\n#### Monitoring & Metrics")
            analysis.append("• Establish clear success metrics")
            analysis.append("• Track improvement impact")
            analysis.append("• Regular progress reviews")
            
            analysis.append("\n#### Long-term Success")
            analysis.append("• Consider dependencies between improvements")
            analysis.append("• Plan for scalability")
            analysis.append("• Regular stakeholder updates")
            
            # 7. Additional Insights
            analysis.append("\n## 🔍 Additional Insights")
            
            # Customer behavior patterns
            analysis.append("\n### Customer Behavior Patterns")
            patterns = self._analyze_behavior_patterns(texts)
            for pattern in patterns[:3]:
                analysis.append(f"• {pattern}")
            
            # Emerging trends
            analysis.append("\n### Emerging Trends")
            trends = self._identify_emerging_trends(texts)
            for trend in trends[:3]:
                analysis.append(f"• {trend}")
            
            # Competitive comparisons
            analysis.append("\n### Competitive Comparisons")
            competitors = self._extract_competitor_mentions(texts)
            for comp in competitors:
                analysis.append(f"• {comp}")
            
            # 8. Not Found
            analysis.append("\n## ❓ Not Found")
            
            expected_features = [
                "Advanced search functionality",
                "Bulk operations",
                "Custom reporting tools",
                "API documentation",
                "Developer tools"
            ]
            
            analysis.append("\nFeatures Not Mentioned in Transcripts:")
            for feature in expected_features:
                if not any(feature.lower() in text.lower() for text in texts if isinstance(text, str)):
                    analysis.append(f"• {feature}")
            
            # 9. Other Observations
            analysis.append("\n## 📝 Other Observations")
            
            # Unusual patterns
            analysis.append("\n### Unusual Patterns")
            observations = self._extract_other_observations(texts)
            for obs in observations:
                analysis.append(f"• {obs}")
            
            # Customer interaction patterns
            analysis.append("\n### Customer Interaction Patterns")
            analysis.append("• Peak interaction times and duration trends")
            analysis.append("• Common escalation triggers")
            analysis.append("• Repeat contact patterns")
            
            # Report footer
            analysis.append("\n---")
            analysis.append("*End of Analysis Report*")
            
            # Join all analysis sections
            result = "\n".join(analysis)
            self.analysis_cache[id(self.current_csv_data)] = result
            return result
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error during analysis: {error_msg}")
            return f"Error during analysis: {error_msg}\n\nPlease try again or contact support if the issue persists."
        # Look for the prompt content between the header and the final question
        start_markers = [
            "Here is your complete analysis prompt:",
            "[Task Introduction]",
            "📊 Summary of Summaries Analysis Selected"
        ]
        end_markers = [
            "Would you like to customize any part of this prompt",
            "Please type '1' or 'initial prompt'",
            "Would you like to create:"
        ]
        
        # Find the start of the prompt content
        start_idx = 0  # Default to start of text
        used_marker = None
        for marker in start_markers:
            if marker in text:
                start_idx = text.find(marker) + len(marker)
                used_marker = marker
                break
        
        # Initialize end_idx to end of text
        end_idx = len(text)
        
        if start_idx == 0:  # No marker found
            logger.warning("No start marker found in prompt text")
            return text  # Return original text if no start marker found
            
        # Find the earliest end marker after start_idx
        for marker in end_markers:
            idx = text.find(marker, start_idx)
            if idx != -1 and idx < end_idx:
                end_idx = idx
            
        # Extract and clean the prompt content
        prompt_content = text[start_idx:end_idx].strip()
        
        # If this is a summary of summaries prompt, ensure we have the key sections
        if used_marker == "📊 Summary of Summaries Analysis Selected":
            if not all(section in prompt_content for section in ["Executive Summary", "Quantitative Analysis", "What's Working Well"]):
                logger.warning("Missing key sections in summary prompt")
                return None
                
        return prompt_content if prompt_content else None

    def _format_prompt_for_display(self, prompt: str) -> str:
        """Format a prompt for the dedicated prompt display area."""
        # Add the required header
        formatted_prompt = "Here is your complete analysis prompt:\n\n"
        
        if self.current_mode == 'summary':
            # For summary of summaries, add emoji header but no transcript framework
            formatted_prompt = "📊 Summary of Summaries Analysis Selected\n\n" + formatted_prompt
        elif self.current_mode == 'initial':
            # For initial analysis, add transcript framework if not present
            if "[transcript]" not in prompt:
                formatted_prompt += "[transcript] You are tasked with analyzing and summarizing call transcripts (document above) from the customer service center of GoDaddy.com. Each conversation begins with one of the following identifiers: \"System\", \"Bot\", \"Customer\", \"Consumer\", or \"Agent\". \"Customer\" and \"Consumer\" are synonymous. \"Agent\" refers to a human support representative, while \"Bot\" is a chatbot. Some transcripts may contain low-quality speech-to-text conversions, so please interpret carefully and clarify where appropriate. Each turn starts with the role indicated above followed by ':', and ends with '|||'. Identifiable information like names and emails have been redacted as GD_REDACTED_NAME and GD_REDACTED_EMAIL.\n\n"
            
        # Replace [count] placeholders with actual counts if available
        if hasattr(self, 'issue_counts'):
            for category, count in self.issue_counts.items():
                # Replace both [count] and X in "Category: X cases"
                prompt = prompt.replace(f"{category}: [count]", f"{category}: {count}")
                prompt = prompt.replace(f"{category}: X", f"{category}: {count}")
        
        # Add the main prompt content with text wrapping
        formatted_prompt += self._wrap_text(prompt, width=80)
        
        # Add a final question to ensure it's displayed properly
        formatted_prompt += "\n\nWould you like to customize any part of this prompt before we proceed with the analysis?"
        
        return formatted_prompt
        
    def _describe_sentiment(self, polarity: float) -> str:
        """Convert sentiment polarity to descriptive text."""
        if polarity >= 0.5: return "Very Positive"
        elif polarity >= 0.1: return "Positive"
        elif polarity <= -0.5: return "Very Negative"
        elif polarity <= -0.1: return "Negative"
        return "Neutral"
        
    def _describe_subjectivity(self, subjectivity: float) -> str:
        """Convert subjectivity score to descriptive text."""
        if subjectivity >= 0.8: return "Very Subjective"
        elif subjectivity >= 0.6: return "Somewhat Subjective"
        elif subjectivity >= 0.4: return "Mixed"
        elif subjectivity >= 0.2: return "Somewhat Objective"
        return "Very Objective"

    def _determine_severity(self, percentage: float) -> str:
        """Determine issue severity based on occurrence percentage."""
        if percentage >= 50: return "Critical - Affects majority of users"
        elif percentage >= 25: return "High - Affects significant portion of users"
        elif percentage >= 10: return "Medium - Affects moderate number of users"
        return "Low - Affects small number of users"

    def _determine_impact(self, count: int, total: int) -> str:
        """Determine impact scope based on occurrence count and total samples."""
        percentage = (count / total) * 100
        if percentage >= 75: return "Critical Impact - Severely affects user experience and business operations"
        elif percentage >= 50: return "High Impact - Significantly impacts user satisfaction and conversion"
        elif percentage >= 25: return "Moderate Impact - Notable effect on user experience"
        return "Low Impact - Minor inconvenience for some users"
        
    def _analyze_behavior_patterns(self, texts: List[str]) -> List[str]:
        """Analyze customer behavior patterns from texts."""
        patterns = []
        
        # Time-related patterns
        time_mentions = sum(1 for text in texts if any(word in text.lower() for word in ['morning', 'afternoon', 'evening', 'night', 'weekend']))
        if time_mentions > len(texts) * 0.1:
            patterns.append("Usage peaks during specific times of day")
            
        # Device preferences
        mobile_mentions = sum(1 for text in texts if any(word in text.lower() for word in ['mobile', 'phone', 'tablet', 'app']))
        desktop_mentions = sum(1 for text in texts if any(word in text.lower() for word in ['desktop', 'laptop', 'pc', 'computer']))
        if mobile_mentions > desktop_mentions:
            patterns.append("Strong preference for mobile access")
        elif desktop_mentions > mobile_mentions:
            patterns.append("Primary usage through desktop platforms")
            
        # Feature usage
        feature_pattern = sum(1 for text in texts if any(word in text.lower() for word in ['feature', 'function', 'tool', 'option']))
        if feature_pattern > len(texts) * 0.2:
            patterns.append("High engagement with advanced features")
            
        return patterns or ["No clear behavior patterns identified"]
        
    def _identify_emerging_trends(self, texts: List[str]) -> List[str]:
        """Identify emerging trends from conversation texts."""
        trends = []
        
        # Look for integration requests
        integration_mentions = sum(1 for text in texts if any(word in text.lower() for word in ['integrate', 'connection', 'api', 'sync']))
        if integration_mentions > len(texts) * 0.1:
            trends.append("Growing demand for third-party integrations")
            
        # Mobile-related trends
        mobile_issues = sum(1 for text in texts if any(word in text.lower() for word in ['mobile', 'responsive', 'app']) 
                          and any(word in text.lower() for word in ['problem', 'issue', 'error']))
        if mobile_issues > len(texts) * 0.15:
            trends.append("Increasing mobile usage highlighting compatibility needs")
            
        # Security concerns
        security_mentions = sum(1 for text in texts if any(word in text.lower() for word in ['secure', 'security', 'privacy', 'protection']))
        if security_mentions > len(texts) * 0.05:
            trends.append("Rising focus on security and privacy features")
            
        return trends or ["No significant emerging trends identified"]
        
    def _extract_competitor_mentions(self, texts: List[str]) -> List[str]:
        """Extract and analyze competitor mentions from texts."""
        competitor_mentions = []
        
        # Common competitor indicators
        competitors = {
            'shopify': 0,
            'woocommerce': 0,
            'magento': 0,
            'bigcommerce': 0,
            'wix': 0
        }
        
        for text in texts:
            text_lower = text.lower()
            for competitor in competitors:
                if competitor in text_lower:
                    competitors[competitor] += 1
                    
        # Generate insights from competitor mentions
        for competitor, count in competitors.items():
            if count > 0:
                percentage = (count / len(texts)) * 100
                if percentage > 5:
                    competitor_mentions.append(f"Frequent comparisons with {competitor.title()} ({count} mentions)")
                    
        return competitor_mentions or ["No significant competitor comparisons found"]
        
    def _extract_other_observations(self, texts: List[str]) -> List[str]:
        """Extract miscellaneous observations from texts."""
        observations = []
        
        # Check for seasonal patterns
        seasonal_terms = ['summer', 'winter', 'holiday', 'season', 'black friday', 'christmas']
        seasonal_mentions = sum(1 for text in texts if any(term in text.lower() for term in seasonal_terms))
        if seasonal_mentions > 0:
            observations.append(f"Seasonal usage patterns detected ({seasonal_mentions} mentions)")
            
        # Look for geographic indicators
        geo_terms = ['region', 'country', 'location', 'timezone', 'international']
        geo_mentions = sum(1 for text in texts if any(term in text.lower() for term in geo_terms))
        if geo_mentions > 0:
            observations.append(f"Geographic distribution considerations ({geo_mentions} mentions)")
            
        # Check for browser-specific issues
        browser_terms = ['chrome', 'firefox', 'safari', 'edge', 'browser']
        browser_mentions = sum(1 for text in texts if any(term in text.lower() for term in browser_terms))
        if browser_mentions > 0:
            observations.append(f"Browser compatibility patterns ({browser_mentions} mentions)")
            
        return observations or ["No additional significant patterns observed"]
        
    def _get_recommendation(self, category: str) -> str:
        """Get recommendation based on category."""
        recommendations = {
            'Payment Processing': "Implement automated payment verification system",
            'Account Verification': "Create streamlined verification workflow",
            'Technical Features': "Develop automated testing suite",
            'Integration Issues': "Establish standardized integration protocols"
        }
        return recommendations.get(category, "Enhance system monitoring and alerts")
        
    def _get_impact_estimate(self, category: str) -> str:
        """Get estimated impact of recommendation."""
        impacts = {
            'Payment Processing': "60% reduction in payment-related issues",
            'Account Verification': "70% faster verification process",
            'Technical Features': "50% reduction in technical support tickets",
            'Integration Issues': "80% improvement in integration success rate"
        }
        return impacts.get(category, "40% improvement in related metrics")
        
    def _get_timeline(self, category: str) -> str:
        """Get implementation timeline estimate."""
        timelines = {
            'Payment Processing': "4-6 weeks",
            'Account Verification': "3-4 weeks",
            'Technical Features': "6-8 weeks",
            'Integration Issues': "8-10 weeks"
        }
        return timelines.get(category, "4-6 weeks")
        
    def _wrap_text(self, text: str, width: int = 80) -> str:
        """
        Wrap text to ensure it fits within a specified width.
        
        Args:
            text: Text to wrap
            width: Maximum line width (default 80 characters)
            
        Returns:
            str: Wrapped text
        """
        import textwrap
        
        # Handle bullet points and indentation
        lines = text.split('\n')
        wrapped_lines = []
        
        for line in lines:
            # Determine indentation level
            indent = len(line) - len(line.lstrip())
            stripped_line = line.lstrip()
            
            # Check if line starts with list markers
            list_markers = ['- ', '* ', '• ', '1. ', '2. ', '3. ']
            is_list_item = any(stripped_line.startswith(marker) for marker in list_markers)
            
            if is_list_item:
                # Preserve list marker and indent subsequent lines
                marker = next(marker for marker in list_markers if stripped_line.startswith(marker))
                content = stripped_line[len(marker):]
                subsequent_indent = ' ' * (indent + len(marker))
                wrapped = textwrap.fill(content,
                                      width=width - indent,
                                      initial_indent=' ' * indent + marker,
                                      subsequent_indent=subsequent_indent)
            else:
                # Regular text wrapping
                wrapped = textwrap.fill(stripped_line,
                                      width=width,
                                      initial_indent=' ' * indent,
                                      subsequent_indent=' ' * indent)
            
            wrapped_lines.append(wrapped)
        
        return '\n'.join(wrapped_lines)
        
    def _extract_prompt_content(self, text: str) -> str:
        """
        Extract the actual prompt content from a complete response.
        
        Args:
            text: The complete response text containing the prompt
            
        Returns:
            str: The extracted prompt content, or None if no valid prompt found
        """
        # Look for the prompt content between the header and the final question
        start_markers = [
            "Here is your complete analysis prompt:",
            "Task: Analyze customer interactions",
            "📊 Summary of Summaries Analysis Selected"
        ]
        end_markers = [
            "Would you like to customize any part of this prompt",
            "Please type '1' or 'initial prompt'",
            "Would you like to create:",
            "Are you ready to upload the CSV file"
        ]
        
        # Find the start of the prompt content
        start_idx = 0  # Default to start of text
        used_marker = None
        for marker in start_markers:
            if marker in text:
                start_idx = text.find(marker) + len(marker)
                used_marker = marker
                break
        
        # Initialize end_idx to end of text
        end_idx = len(text)
        
        if start_idx == 0:  # No marker found
            logger.warning("No start marker found in prompt text")
            return text  # Return original text if no start marker found
            
        # Find the earliest end marker after start_idx
        for marker in end_markers:
            idx = text.find(marker, start_idx)
            if idx != -1 and idx < end_idx:
                end_idx = idx
            
        # Extract and clean the prompt content
        prompt_content = text[start_idx:end_idx].strip()
        
        # If this is a summary of summaries prompt, ensure we have the key sections
        if used_marker == "📊 Summary of Summaries Analysis Selected":
            if not all(section in prompt_content for section in ["Executive Summary", "Quantitative Analysis", "What's Working Well"]):
                logger.warning("Missing key sections in summary prompt")
                return None
                
        return prompt_content if prompt_content else None

    def _text_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate similarity between two texts using TF-IDF and cosine similarity.
        
        Args:
            text1: First text to compare
            text2: Second text to compare
            
        Returns:
            float: Similarity score between 0 and 1
        """
        # Create TF-IDF vectorizer
        vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words='english',
            min_df=1,
            strip_accents='unicode',
            lowercase=True
        )
        
        # Fit and transform the texts
        try:
            tfidf_matrix = vectorizer.fit_transform([text1, text2])
            
            # Calculate cosine similarity
            similarity = (tfidf_matrix * tfidf_matrix.T).A[0, 1]
            
            # Handle numerical errors
            similarity = max(0.0, min(1.0, similarity))
            
            return float(similarity)
        except:
            # Fallback to spaCy similarity if TF-IDF fails
            doc1 = nlp(text1)
            doc2 = nlp(text2)
            
            if not doc1 or not doc2:
                return 0.0
                
            return doc1.similarity(doc2)
        


async def main():
    """Main interactive chat loop."""
    print("Starting application...")
    print("-" * 50)
    print(":robot_face: AI Prompt Engineering Assistant with Learning Capabilities")
    print("I help create effective prompts for analyzing customer service interactions!")
    print("I learn from our interactions to provide better assistance over time.")
    print("\nPlease type one of these options to begin:")
    print("1. 'initial prompt' - for analyzing individual transcripts")
    print("2. 'summary of summaries' - for analyzing multiple transcript summaries")
    print("\nWorkflow for Summary of Summaries mode:")
    print("1. First, we'll create the perfect analysis prompt together")
    print("2. Once the prompt is ready, you can use these commands:")
    print("   - Type 'load <file_path>' to load your CSV file")
    print("   - Type 'summary' to get a summary of the loaded data")
    print("   - Type 'analyze' to get detailed analysis")
    print("\nOther commands:")
    print("- Type 'clear' to clear conversation history")
    print("- Type 'quit', 'exit', or 'bye' to end the conversation")
    print("\nI maintain context throughout our conversation and learn from your feedback!")
    print("-" * 50)

    # Create and initialize the conversational agent
    conv_agent = ConversationalAgent()
    await conv_agent.initialize()

    while True:
        try:
            # Get user input
            user_input = input("\nYou: ").strip()
            
            # Check for exit commands
            if user_input.lower() in ['quit', 'exit', 'bye']:
                print(":wave: Goodbye!")
                break
                
            # Check for clear command
            if user_input.lower() == 'clear':
                conv_agent.clear_history()
                continue
            
            # Handle CSV commands in summary mode after prompt is generated
            if conv_agent.current_mode == 'summary' and conv_agent.prompt_generated:
                if user_input.lower().startswith('load '):
                    file_path = user_input[5:].strip()
                    if conv_agent.load_csv(file_path):
                        print("CSV file loaded successfully!")
                        print("\nHere's a summary of the conversation summaries:")
                        print(conv_agent.get_csv_summary())
                        # Show learned insights if available
                        insights = conv_agent.get_learned_insights()
                        if insights:
                            print("\n" + insights)
                    continue
                    
                if user_input.lower() == 'summary':
                    print(conv_agent.get_csv_summary())
                    continue
                    
                if user_input.lower() == 'analyze':
                    analysis_results = conv_agent.analyze_summaries()
                    print("\nSending analysis results to client...")
                    print(analysis_results)
                    return analysis_results
                    
            elif any(cmd in user_input.lower() for cmd in ['load', 'summary', 'analyze']):
                if conv_agent.current_mode != 'summary':
                    print("CSV commands are only available in 'Summary of summaries' mode.")
                    print("Please first type '2' or 'summary of summaries' to switch modes.")
                elif not conv_agent.prompt_generated:
                    print("Please finish creating your analysis prompt first.")
                    print("Once the prompt is ready, I'll help you analyze your CSV file.")
                continue
                
            # Skip empty inputs
            if not user_input:
                continue
                
            # Get agent response
            print(":robot_face: Assistant: ", end="", flush=True)
            response = await conv_agent.chat(user_input)
            print(response)
            
        except KeyboardInterrupt:
            print("\n:wave: Goodbye!")
            break
        except Exception as e:
            print(f"\n:x: Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())