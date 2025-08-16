"""
GOCAAS Agents SDK implementation.
"""

import os
import asyncio
import json
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
                    return """📊 Summary of Summaries Analysis Selected

Here is your complete analysis prompt for analyzing multiple conversation summaries:

[Task Introduction]
You are tasked with analyzing multiple customer service conversation summaries from GoDaddy.com to identify patterns, trends, and actionable insights.

### Issue Counts
1. Email-Related Categories
   - Email Configuration: [count] cases
   - DNS Settings: [count] cases
   - Email Migration: [count] cases
   - Email Security: [count] cases
   
2. Key Metrics
   - Total cases analyzed
   - Most common issue type
   - Distribution across categories

2. Pain Point Analysis
   - Identify and categorize customer pain points
   - Determine severity and impact levels
   - Extract root causes and contributing factors
   - Map customer journey friction points

3. Impact Assessment
   - Business impact (revenue, retention, etc.)
   - Customer experience impact
   - Technical implications
   - Resource utilization impact

### Top 3 Issues Analysis
For each of the top 3 issues:

1. Problem Profile
   - Clear problem statement
   - Frequency (count and %)
   - Root cause analysis
   - Affected customer segments

2. Impact Analysis
   - Customer experience impact
   - Business impact
   - Technical implications

3. Supporting Evidence
   - 2-3 representative customer quotes
   - Context and circumstances

4. Key Recommendation
   - One clear, actionable recommendation
   - Expected impact
   - Implementation timeline
   - Success metrics

### Additional Insights
1. Emerging Trends
   - New issue patterns
   - Customer behavior shifts
   - Product/feature impacts
   - Support efficiency trends

2. Opportunity Areas
   - Process improvements
   - Feature enhancements
   - Documentation needs
   - Training requirements

### Not Found
- Document expected but missing elements
- Data gaps and limitations
- Areas needing further investigation

### Analysis Instructions
1. Focus on actionable insights
2. Provide specific examples
3. Include quantitative metrics
4. Note data limitations
5. Highlight priority areas

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

Task Introduction:
"You are tasked with analyzing the 'conversation_summary' column from a CSV file containing customer service interaction summaries from GoDaddy.com."

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
            if self.current_mode == 'summary':
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
            
            # Check specifically for 'conversation_summary' column
            if 'conversation_summary' not in df.columns:
                raise ValueError("CSV file must contain a 'conversation_summary' column. Please check your file format.")
            
            # Store only the conversation_summary column
            self.current_csv_data = df[['conversation_summary']].copy()
            
            # Generate summary focused on conversation data
            summary = []
            summary.append("Processing 'conversation_summary' column")
            summary.append(f"Number of conversation summaries: {len(self.current_csv_data)}")
            
            # Quick initial summary without expensive operations
            summary.append(f"\nQuick Summary:")
            summary.append(f"- Total entries: {len(self.current_csv_data)}")
            
            # Calculate statistics on all entries
            word_counts = self.current_csv_data['conversation_summary'].str.split().str.len()
            summary.append(f"\nComplete Statistics (all {len(self.current_csv_data)} entries):")
            summary.append(f"- Average words per summary: {word_counts.mean():.1f}")
            summary.append(f"- Shortest summary: {word_counts.min()} words")
            summary.append(f"- Longest summary: {word_counts.max()} words")
            
            # Show first 3 examples with full text
            summary.append("\nExample Summaries:")
            for idx, text in enumerate(self.current_csv_data['conversation_summary'].head(3), 1):
                summary.append(f"\n{idx}. {text}")  # Show complete text
            
            self.csv_summary = "\n".join(summary)
            return True
            
        except Exception as e:
            print(f"Error loading CSV file: {e}")
            self.current_csv_data = None
            self.csv_summary = None
            return False

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
        Perform comprehensive analysis of conversation summaries using the stored prompt.
        Returns:
            str: Detailed analysis results
        """
        try:
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
                
            # Always get the latest prompt before analysis
            latest_prompt = self._get_latest_prompt()
            if latest_prompt:
                self.current_analysis_prompt = latest_prompt
                self.prompt_generated = True
                logger.info("Using latest generated prompt for analysis")
            else:
                # Double check conversation history for any prompt
                for message in reversed(self.conversation_history):
                    if message["role"] == "assistant" and any(marker in message["content"] for marker in [
                        "Here is your complete analysis prompt:",
                        "Task Introduction",
                        "Quantitative Analysis"
                    ]):
                        self.current_analysis_prompt = self._extract_prompt_content(message["content"])
                        self.prompt_generated = True
                        logger.info("Found prompt in conversation history")
                        break
                
            if not self.current_analysis_prompt:
                return "No analysis prompt has been generated yet. Please generate a prompt first."
                
            # Use cache if available
            cache_key = id(self.current_csv_data)
            if cache_key in self.analysis_cache:
                return self.analysis_cache[cache_key]
            
            analysis = []
            series = self.current_csv_data['conversation_summary']
            texts = series.dropna().tolist()
            
            # Initialize analysis structure
            analysis = []
            total_cases = len(texts)
            
            # Issue Counts Analysis
            analysis.append("# 📊 Issue Counts\n")
            
            # Reset issue counts
            self.issue_counts = {
                'Email Configuration': 0,
                'DNS Settings': 0,
                'Email Migration': 0,
                'Email Security': 0
            }
            
            # Define category keywords
            category_keywords = {
                'Email Configuration': ['smtp', 'imap', 'pop3', 'email setup', 'email config', 'email settings', 'outlook', 'thunderbird'],
                'DNS Settings': ['dns', 'mx record', 'nameserver', 'domain name system', 'dns zone', 'a record', 'cname'],
                'Email Migration': ['migrate', 'transfer email', 'move email', 'import email', 'export email', 'switch email'],
                'Email Security': ['spam', 'phishing', 'security', 'authentication', 'encryption', 'password', 'hack', 'compromise']
            }
            
            # Analyze each text for category matching
            logger.info(f"Starting analysis of {len(texts)} texts")
            for text in tqdm(texts, desc="Analyzing issues"):
                if not text:
                    continue
                    
                text_lower = text.lower()
                # Count matches for each category
                for category, keywords in category_keywords.items():
                    if any(word in text_lower for word in keywords):
                        self.issue_counts[category] += 1
                        logger.debug(f"Found match for {category} in text: {text[:100]}...")
            
            # Output category counts with text wrapping
            analysis.append("## Email-Related Categories")
            category_text = []
            for category, count in self.issue_counts.items():
                category_text.append(f"- {category}: {count} cases")
            analysis.append(self._wrap_text('\n'.join(category_text), width=80))
            
            # Log category counts
            logger.info("Category counts:")
            for category, count in self.issue_counts.items():
                logger.info(f"{category}: {count} cases")
            
            # Get total number of cases
            analysis.append("# Analysis Based on Generated Prompt")
            analysis.append(f"\nTotal Cases Analyzed: {total_cases}")
            
            # Sort categories by count and get top issues
            try:
                # Log current state
                logger.info("Preparing to sort categories")
                logger.info(f"Current issue counts: {self.issue_counts}")
                
                # Sort categories
                sorted_categories = sorted(
                    [(k, v) for k, v in self.issue_counts.items() if v > 0],  # Only include categories with matches
                    key=lambda x: x[1],
                    reverse=True
                )
                
                logger.info(f"Sorted categories: {sorted_categories}")
                
                # Get top 3 issues
                top_3_issues = sorted_categories[:3]
                logger.info(f"Top 3 issues: {top_3_issues}")
                
                # Validate we have issues to analyze
                if not top_3_issues:
                    logger.warning("No issues found in the analysis")
                    return "No issues found to analyze. Please check the data."
                    
                # Add separator for readability
                analysis.append("\n" + "="*50 + "\n")
                
            except Exception as e:
                logger.error(f"Error during category sorting: {e}")
                raise
            # Analyze top 3 issues
            for i, (category, count) in enumerate(top_3_issues, 1):
                analysis.append(f"\n### Issue {i}: {category}")
                analysis.append(f"**Frequency**: {count} cases")
                
                # Find examples for this category
                examples = []
                for text in texts:
                    text_lower = text.lower()
                    # Match based on category keywords
                    if category == 'Email Configuration' and any(word in text_lower for word in ['smtp', 'imap', 'pop3', 'email setup', 'email config', 'email settings']):
                        examples.append(text)
                    elif category == 'DNS Settings' and any(word in text_lower for word in ['dns', 'mx record', 'nameserver', 'domain name system', 'dns zone']):
                        examples.append(text)
                    elif category == 'Email Migration' and any(word in text_lower for word in ['migrate', 'transfer email', 'move email', 'import email', 'export email']):
                        examples.append(text)
                    elif category == 'Email Security' and any(word in text_lower for word in ['spam', 'phishing', 'security', 'authentication', 'encryption', 'password']):
                        examples.append(text)
                
                # Add examples
                if examples:
                    analysis.append("\n**Representative Examples:**")
                    for j, example in enumerate(examples[:2], 1):  # Show up to 2 examples
                        analysis.append(f"{j}. {example}")
                
                # Add impact analysis
                analysis.append("\n**Impact Analysis:**")
                analysis.append(f"- Customer Impact: {self._determine_impact(count, total_cases)}")
                
                # Add recommendation
                analysis.append("\n**Key Recommendation:**")
                if category == 'Email Configuration':
                    analysis.append("- Implement automated configuration wizard")
                    analysis.append("- Expected Impact: 60% reduction in setup issues")
                    analysis.append("- Timeline: 3-4 weeks")
                elif category == 'DNS Settings':
                    analysis.append("- Create DNS verification tool")
                    analysis.append("- Expected Impact: 70% faster DNS resolution")
                    analysis.append("- Timeline: 2-3 weeks")
                elif category == 'Email Migration':
                    analysis.append("- Develop migration assistant")
                    analysis.append("- Expected Impact: 50% faster migrations")
                    analysis.append("- Timeline: 4-5 weeks")
                elif category == 'Email Security':
                    analysis.append("- Enhance security monitoring")
                    analysis.append("- Expected Impact: 80% faster threat detection")
                    analysis.append("- Timeline: 3-4 weeks")
                
                # Add success metrics
                analysis.append("\n**Success Metrics:**")
                analysis.append("- Reduction in support tickets")
                analysis.append("- Improved customer satisfaction")
                analysis.append("- Decreased resolution time")
                
                # Add sentiment analysis for this category
                if examples:
                    sentiments = [self._analyze_sentiment(text)['polarity'] for text in examples]
                    avg_sentiment = sum(sentiments) / len(sentiments)
                    analysis.append(f"\n**Customer Sentiment:** {self._describe_sentiment(avg_sentiment)}")
                
                analysis.append("")  # Add spacing between issues
            
            # Performance Metrics
            analysis.append("\n## Performance Metrics")
            stats = self._analyze_text_stats(texts)
            sentiments = [self._analyze_sentiment(text) for text in tqdm(texts, desc="Analyzing sentiment")]
            avg_polarity = np.mean([s['polarity'] for s in sentiments])
            
            analysis.append("\n| Metric | Value | Notes |")
            analysis.append("|--------|--------|--------|")
            analysis.append(f"| Average Response Length | {stats['avg_words']:.1f} words | Indicates detail level of responses |")
            analysis.append(f"| Customer Satisfaction | {self._describe_sentiment(avg_polarity)} | Based on sentiment analysis |")
            
            # Top Issues Analysis
            analysis.append("\n# 🎯 Top Issues Analysis")
            
            # Extract and analyze specific content from the conversation summaries
            all_pain_points = []
            
            # First pass - identify specific issues and their context
            issue_details = defaultdict(list)
            for text in texts:
                # Process text with spaCy for better analysis
                doc = nlp(text.lower())
                
                # Initialize issue tracking
                current_issue = {
                    'text': text,
                    'specific_issue': None,
                    'product': None,
                    'action_taken': None,
                    'outcome': None,
                    'customer_impact': None,
                    'technical_details': None,
                    'sentiment': TextBlob(text).sentiment.polarity,
                    'urgency': False
                }
                
                # Extract specific issue details
                for sent in doc.sents:
                    sent_text = sent.text.lower()
                    
                    # Look for specific product mentions
                    products = ['hosting', 'domain', 'ssl', 'cpanel', 'wordpress', 'email', 'dns']
                    for product in products:
                        if product in sent_text:
                            current_issue['product'] = product
                            break
                    
                    # Identify technical details
                    technical_indicators = ['error', 'configuration', 'setup', 'settings', 'server', 'database']
                    if any(ind in sent_text for ind in technical_indicators):
                        current_issue['technical_details'] = sent.text
                    
                    # Capture action taken
                    action_indicators = ['resolved', 'fixed', 'implemented', 'updated', 'modified', 'changed']
                    if any(ind in sent_text for ind in action_indicators):
                        current_issue['action_taken'] = sent.text
                    
                    # Identify customer impact
                    impact_indicators = ['unable to', 'cannot', 'failed to', 'preventing', 'blocking']
                    if any(ind in sent_text for ind in impact_indicators):
                        current_issue['customer_impact'] = sent.text
                    
                    # Check for urgency indicators
                    urgency_indicators = ['urgent', 'asap', 'emergency', 'critical', 'immediate', 'blocking', 'production down']
                    if any(ind in sent_text for ind in urgency_indicators):
                        current_issue['urgency'] = True
                
                # Extract the specific issue using key phrases and context
                issue_phrases = []
                for chunk in doc.noun_chunks:
                    if len(chunk.text.split()) >= 2:  # Multi-word phrases
                        # Look for phrases that indicate specific problems
                        if any(word in chunk.text.lower() for word in ['issue', 'problem', 'error', 'failure', 'bug']):
                            issue_phrases.append(chunk.text)
                
                if issue_phrases:
                    # Use the most detailed issue phrase
                    current_issue['specific_issue'] = max(issue_phrases, key=len)
                else:
                    # Fallback to first sentence if no specific issue phrase found
                    current_issue['specific_issue'] = next(doc.sents).text
                
                # Group by product + issue type for more specific categorization
                issue_key = f"{current_issue['product']}_{current_issue['specific_issue']}" if current_issue['product'] else current_issue['specific_issue']
                issue_details[issue_key].append(current_issue)
            
            # Sort issues by frequency, urgency, and impact
            sorted_issues = sorted(
                [(issue_key, details) for issue_key, details in issue_details.items()],
                key=lambda x: (
                    len(x[1]),  # frequency
                    sum(1 for i in x[1] if i['urgency']),  # number of urgent cases
                    -sum(i['sentiment'] for i in x[1])/len(x[1])  # negative sentiment (higher priority)
                ),
                reverse=True
            )[:3]  # Top 3 most significant issues
            
            # Present each issue with full context
            for i, (issue_key, instances) in enumerate(sorted_issues, 1):
                # Get the most representative instance (prioritize urgent and detailed cases)
                best_instance = max(instances, key=lambda x: (
                    x['urgency'],
                    bool(x['technical_details']),
                    bool(x['customer_impact']),
                    len(x['text'])
                ))
                
                # Format issue title
                product = best_instance['product']
                issue_title = f"{product.title() + ' ' if product else ''}{best_instance['specific_issue'].title()}"
                
                analysis.append(f"\n## Issue {i}: {issue_title}")
                analysis.append(f"\n### Issue Details:")
                analysis.append(f"- **Frequency**: {len(instances)} occurrences")
                analysis.append(f"- **Product Area**: {product.title() if product else 'General'}")
                if best_instance['technical_details']:
                    analysis.append(f"- **Technical Context**: {best_instance['technical_details']}")
                if best_instance['customer_impact']:
                    analysis.append(f"- **Customer Impact**: {best_instance['customer_impact']}")
                
                # Show urgency and sentiment
                urgent_count = sum(1 for i in instances if i['urgency'])
                if urgent_count:
                    analysis.append(f"- **Urgency**: {urgent_count} urgent cases")
                avg_sentiment = sum(i['sentiment'] for i in instances)/len(instances)
                analysis.append(f"- **Customer Sentiment**: {self._describe_sentiment(avg_sentiment)}")
                
                # Show resolution information if available
                resolved_cases = [i for i in instances if i['action_taken']]
                if resolved_cases:
                    analysis.append("\n### Resolution Examples:")
                    for case in resolved_cases[:2]:  # Show up to 2 resolution examples
                        analysis.append(f"```\n{case['action_taken']}\n```")
            
            # Second pass - detailed analysis with context
            for text in texts:
                # Initialize analysis variables
                category = "other"
                subcategory = "general"
                issue_type = "other"
                severity = "medium"
                issue = None
                action = None
                impact = None
                context = None
                
                # Match against identified issues
                text_lower = text.lower()
                matched_issues = [key for key, _ in sorted_issues if key.lower() in text_lower]
                
                # Enhanced categorization with subcategories
                # Email issues
                if any(word in text.lower() for word in ["email", "smtp", "mail", "inbox"]):
                    category = "email"
                    if "delivery" in text.lower() or "bounce" in text.lower():
                        subcategory = "delivery"
                        issue_type = "email_delivery"
                    elif "setup" in text.lower() or "configuration" in text.lower():
                        subcategory = "configuration"
                        issue_type = "email_setup"
                    elif "spam" in text.lower() or "filter" in text.lower():
                        subcategory = "spam"
                        issue_type = "spam_filtering"
                
                # Domain issues
                elif any(word in text.lower() for word in ["domain", "dns", "nameserver"]):
                    category = "domain"
                    if "transfer" in text.lower():
                        subcategory = "transfer"
                        issue_type = "domain_transfer"
                    elif "dns" in text.lower() or "nameserver" in text.lower():
                        subcategory = "dns"
                        issue_type = "dns_configuration"
                    elif "renew" in text.lower() or "expir" in text.lower():
                        subcategory = "renewal"
                        issue_type = "domain_renewal"
                
                # Hosting issues
                elif any(word in text.lower() for word in ["host", "server", "website", "site"]):
                    category = "hosting"
                    if "down" in text.lower() or "unavailable" in text.lower():
                        subcategory = "availability"
                        issue_type = "site_down"
                    elif "slow" in text.lower() or "performance" in text.lower():
                        subcategory = "performance"
                        issue_type = "site_performance"
                    elif "ssl" in text.lower() or "certificate" in text.lower():
                        subcategory = "ssl"
                        issue_type = "ssl_certificate"
                
                # Billing issues
                elif any(word in text.lower() for word in ["bill", "payment", "charge", "refund"]):
                    category = "billing"
                    if "refund" in text.lower():
                        subcategory = "refund"
                        issue_type = "refund_request"
                    elif "overcharge" in text.lower() or "wrong" in text.lower():
                        subcategory = "billing_error"
                        issue_type = "incorrect_charge"
                    elif "cancel" in text.lower():
                        subcategory = "cancellation"
                        issue_type = "service_cancellation"
                
                # Account issues
                elif any(word in text.lower() for word in ["login", "password", "access", "account"]):
                    category = "account"
                    if "password" in text.lower() or "reset" in text.lower():
                        subcategory = "password"
                        issue_type = "password_reset"
                    elif "login" in text.lower() or "access" in text.lower():
                        subcategory = "access"
                        issue_type = "login_issues"
                    elif "security" in text.lower() or "hack" in text.lower():
                        subcategory = "security"
                        issue_type = "security_concern"
                
                # Determine severity based on keywords and context
                severity_indicators = {
                    'high': ['urgent', 'critical', 'emergency', 'immediate', 'serious'],
                    'medium': ['important', 'significant', 'moderate'],
                    'low': ['minor', 'small', 'trivial']
                }
                
                text_lower = text.lower()
                for level, indicators in severity_indicators.items():
                    if any(indicator in text_lower for indicator in indicators):
                        severity = level
                        break
                
                # Extract other information
                for sent in doc.sents:
                    if "issue" in sent.text or "problem" in sent.text:
                        issue = sent.text
                    elif "did" in sent.text or "action" in sent.text:
                        action = sent.text
                    elif "impact" in sent.text or "result" in sent.text:
                        impact = sent.text
                    elif "when" in sent.text or "during" in sent.text:
                        context = sent.text
                
                # Add to pain points list with enhanced categorization
                all_pain_points.append({
                    'category': category,
                    'subcategory': subcategory,
                    'issue_type': issue_type,
                    'severity': severity,
                    'issue': issue,
                    'action': action,
                    'impact': impact,
                    'context': context,
                    'full_text': text
                })
            
            # Analyze the significant themes and their contexts
            for i, (issue_key, instances) in enumerate(sorted_issues, 1):
                # Calculate statistics
                urgent_count = sum(1 for i in instances if any(word in i['text'].lower() for word in 
                    ['urgent', 'asap', 'emergency', 'critical', 'immediate', 'blocking', 'production down']))
                avg_sentiment = sum(i['sentiment'] for i in instances) / len(instances)
                
                # Format the issue title based on actual content
                sentiment_desc = "negative" if avg_sentiment < -0.1 else "positive" if avg_sentiment > 0.1 else "neutral"
                urgency_level = "Critical" if urgent_count/len(instances) > 0.3 else "Important" if urgent_count > 0 else "Regular"
                
                analysis.append(f"\n## Issue {i}: {issue_key.title()}")
                analysis.append(f"\n### Overview:")
                analysis.append(f"- **Frequency**: {len(instances)} related conversations")
                analysis.append(f"- **Urgency Level**: {urgency_level} ({urgent_count} urgent cases)")
                analysis.append(f"- **Customer Sentiment**: {sentiment_desc.title()}")
                
                # Add specific examples
                # Sort instances by severity and get examples
                severe_cases = []
                normal_cases = []
                for instance in instances:
                    try:
                        # Try to get text from either 'text' or 'full_text' key
                        text = instance.get('text', instance.get('full_text', ''))
                        if not text:
                            logger.warning(f"Instance missing text content: {instance}")
                            continue
                            
                        # Check for urgency/severity in the text
                        urgency_words = [
                            'urgent', 'asap', 'emergency', 'critical', 
                            'immediate', 'blocking', 'production down',
                            'high priority', 'outage', 'severe'
                        ]
                        text_lower = text.lower()
                        is_urgent = any(word in text_lower for word in urgency_words)
                        
                        # Also check technical indicators for severity
                        tech_indicators = [
                            'error', 'failed', 'broken', 'crash',
                            'not working', 'down', 'unavailable'
                        ]
                        has_tech_issues = any(indicator in text_lower for indicator in tech_indicators)
                        
                        # Combine urgency indicators
                        if is_urgent or (has_tech_issues and 'urgent' in text_lower):
                            severe_cases.append(text)
                        else:
                            normal_cases.append(text)
                            
                    except Exception as e:
                        logger.error(f"Error processing instance: {e}")

                if severe_cases:
                    analysis.append("\n### Critical Case Example:")
                    # Get complete sentence
                    doc = nlp(severe_cases[0])
                    first_sentence = next(doc.sents).text
                    analysis.append(f"```\n{first_sentence}\n```")
                
                if normal_cases:
                    analysis.append("\n### Typical Case Example:")
                    # Get complete sentence
                    doc = nlp(normal_cases[0])
                    first_sentence = next(doc.sents).text
                    analysis.append(f"```\n{first_sentence}\n```")
                
                # Get all issues for this category
                category_issues = [p for p in all_pain_points if p['category'] == category]
                
                # Category Profile with detailed breakdown
                analysis.append("\n### Category Profile")
                analysis.append("- **Frequency**: " + f"{count} occurrences")
                
                # Analyze subcategories
                subcategory_counts = Counter(issue['subcategory'] for issue in category_issues)
                analysis.append("\n### Subcategories:")
                for subcategory, subcount in subcategory_counts.most_common():
                    sub_percentage = (subcount / count * 100)
                    analysis.append(f"- {subcategory.title()}: {subcount} ({sub_percentage:.1f}%)")
                
                # Analyze issue types
                issue_type_counts = Counter(issue['issue_type'] for issue in category_issues)
                analysis.append("\n### Issue Types:")
                for issue_type, type_count in issue_type_counts.most_common():
                    type_percentage = (type_count / count * 100)
                    analysis.append(f"- {issue_type.replace('_', ' ').title()}: {type_count} ({type_percentage:.1f}%)")
                
                # Severity breakdown
                severity_counts = Counter(issue['severity'] for issue in category_issues)
                analysis.append("\n### Severity Distribution:")
                for severity, sev_count in severity_counts.most_common():
                    sev_percentage = (sev_count / count * 100)
                    analysis.append(f"- {severity.title()}: {sev_count} ({sev_percentage:.1f}%)")
                
                # Impact Analysis
                analysis.append("\n### Impact Analysis:")
                analysis.append("- **Overall Severity**: " + ("High" if count > 20 else "Medium" if count > 10 else "Low"))
                analysis.append("- **Impact Scope**: " + ("Wide" if count > 20 else "Moderate" if count > 10 else "Limited"))
                
                # Example issues
                analysis.append("\n### Representative Examples:")
                high_severity = [issue for issue in category_issues if issue['severity'] == 'high']
                if high_severity:
                    analysis.append("\nHigh Severity Example:")
                    example = high_severity[0]
                    analysis.append(f"- Type: {example['issue_type'].replace('_', ' ').title()}")
                    analysis.append(f"- Subcategory: {example['subcategory'].title()}")
                    # Get complete sentence
                    doc = nlp(example['full_text'])
                    first_sentence = next(doc.sents).text
                    analysis.append(f"- Description: {first_sentence}")
                
                # Get pain points for this category
                category_points = [p for p in all_pain_points if p['category'] == category]
                
                # Detailed Breakdown
                analysis.append("\n### Detailed Breakdown")
                # Use OpenAI to analyze the problems
                try:
                    # Prepare the context for analysis
                    category_texts = [
                        {
                            'text': p['full_text'],
                            'issue': p['issue'],
                            'impact': p['impact'],
                            'context': p['context']
                        }
                        for p in category_points
                    ]
                    
                    # Use the stored analysis prompt and add the specific data
                    analysis_prompt = f"""Using the following analysis framework:

{self.current_analysis_prompt}

Please analyze these specific customer service issues in the {category} category:

Issues to analyze:
{json.dumps(category_texts[:5], indent=2)}

Follow the exact structure and requirements specified in the framework above. Focus on actionable insights, provide specific examples, include quantitative metrics, note data limitations, and highlight priority areas."""
                    
                    # Get analysis from OpenAI
                    response = self.client.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=[
                            {"role": "system", "content": """You are an expert business analyst specializing in customer service analytics. Your analysis must:
1. Follow the exact structure provided in the prompt
2. Use clear section headers with ### for major sections
3. Provide specific, actionable insights
4. Include quantitative metrics whenever possible
5. Support findings with specific examples and quotes
6. Highlight priority areas and immediate actions needed
7. Be thorough but concise in each section"""},
                            {"role": "user", "content": analysis_prompt}
                        ],
                        temperature=0.7
                    )
                    
                    # Extract and format the analysis
                    analysis_text = response.choices[0].message.content
                    
                    # Add the analysis to our output
                    analysis.append("\n### Problem Analysis")
                    analysis.append(analysis_text)
                    
                except Exception as e:
                    # Fallback to basic analysis if OpenAI call fails
                    analysis.append("\n### Problem Analysis")
                    analysis.append("**Key Problems Identified:**")
                    
                    # Group similar issues together using text similarity
                    grouped_issues = {}
                    for point in category_points:
                        text = point['full_text'].lower()
                        matched = False
                        for key in grouped_issues:
                            if self._text_similarity(key, text) > 0.7:  # 70% similarity threshold
                                grouped_issues[key].append(point)
                                matched = True
                                break
                        if not matched:
                            grouped_issues[text] = [point]
                    
                    # Show top 3 most significant problems
                    for i, (key, points) in enumerate(sorted(grouped_issues.items(), key=lambda x: len(x[1]), reverse=True)[:3], 1):
                        analysis.append(f"\nProblem {i}:")
                        # Get the most detailed example
                        best_example = max(points, key=lambda p: len(p['full_text']))
                        analysis.append(f"- Issue: {best_example['full_text']}")
                        if best_example['impact']:
                            analysis.append(f"- Impact: {best_example['impact']}")
                        if best_example['context']:
                            analysis.append(f"- Context: {best_example['context']}")
                        analysis.append(f"- Frequency: {len(points)} similar occurrences")
                
                # Evidence Base
                analysis.append("\n### Evidence Base")
                analysis.append("**Representative Cases:**")
                for j, point in enumerate(category_points[:3], 1):
                    analysis.append(f"{j}. Category: {point['category'].title()}")
                    analysis.append(f"   Issue: {point['issue'] if point['issue'] else 'N/A'}")
                    analysis.append(f"   Action: {point['action'] if point['action'] else 'N/A'}")
                    analysis.append(f"   Impact: {point['impact'] if point['impact'] else 'N/A'}")
                    analysis.append(f"   Context: {point['context'] if point['context'] else 'N/A'}")
                    # Get complete sentence
                    doc = nlp(point['full_text'])
                    first_sentence = next(doc.sents).text
                    analysis.append(f"   Full Text: > {first_sentence}")
            
            # Specific Recommendations
            analysis.append("\n# 💡 Specific Recommendations")
            
            # Get recommendations based on identified issues
            for i, (issue_key, instances) in enumerate(sorted_issues[:3], 1):
                best_instance = max(instances, key=lambda x: (
                    x['urgency'],
                    bool(x['technical_details']),
                    bool(x['customer_impact'])
                ))
            
                # Format recommendation title
                product = best_instance['product']
                issue_title = f"{product.title() + ' ' if product else ''}{best_instance['specific_issue'].title()}"
                analysis.append(f"\n## For {issue_title}")
                
                # Add specific recommendations based on the issue details
                analysis.append("\n### Solution Package")
                if best_instance['technical_details']:
                    analysis.append("1. **Technical Fix:**")
                    analysis.append(f"   - Address: {best_instance['technical_details']}")
                    analysis.append("   - Implement automated detection")
                    analysis.append("   - Add monitoring alerts")
                
                if best_instance['customer_impact']:
                    analysis.append("\n2. **Customer Experience:**")
                    analysis.append(f"   - Mitigate: {best_instance['customer_impact']}")
                    analysis.append("   - Improve error messaging")
                    analysis.append("   - Add proactive notifications")
                
                # Add implementation details
                analysis.append("\n### Implementation Guide")
                analysis.append(f"- **Priority**: {'High' if best_instance['urgency'] else 'Medium'}")
                analysis.append("- **Timeline**: 2-3 weeks")
                analysis.append("- **Success Metrics**: Reduction in similar issues")
                
                # Get pain points for this category for targeted recommendations
                category_points = [p for p in all_pain_points if p['category'] == category]
                common_issues = Counter(p['issue'] for p in category_points if p['issue']).most_common(3)
                
                analysis.append("\n### Key Recommendation")
                if common_issues:
                    main_issue = common_issues[0][0]  # Get the most common issue
                    analysis.append(f"**Primary Action**: Based on the analysis of {len(instances)} related cases")
                    
                    # Determine recommendation based on issue type
                    if 'technical' in main_issue.lower() or any(word in main_issue.lower() for word in ['error', 'bug', 'crash']):
                        analysis.append("- Implement automated monitoring and early warning system")
                        analysis.append("- Expected Impact: Reduce issue detection time by 70%")
                        analysis.append("- Timeline: 4-6 weeks for implementation")
                    elif 'configuration' in main_issue.lower() or 'setup' in main_issue.lower():
                        analysis.append("- Create interactive setup wizard with validation checks")
                        analysis.append("- Expected Impact: 50% reduction in setup-related issues")
                        analysis.append("- Timeline: 2-3 weeks for development")
                    else:
                        analysis.append("- Enhance user documentation and support resources")
                        analysis.append("- Expected Impact: 40% reduction in related support tickets")
                        analysis.append("- Timeline: 1-2 weeks for completion")
                        
                    analysis.append("\n**Success Metrics**:")
                    analysis.append("- Reduction in related support tickets")
                    analysis.append("- Improved customer satisfaction scores")
                    analysis.append("- Decreased resolution time")
            
            # What's Working Well
            analysis.append("\n# ✅ What's Working Well")
            positive_texts = [text for text in texts if self._analyze_sentiment(text)['polarity'] > 0.5]
            
            analysis.append("\n## Success Patterns")
            if positive_texts:
                for text in positive_texts[:3]:
                    # Get complete sentence
                    doc = nlp(text)
                    first_sentence = next(doc.sents).text
                    analysis.append(f"- {first_sentence}")
            
            # Additional Insights
            analysis.append("\n# 🔍 Additional Insights")
            
            analysis.append("\n## Trend Analysis")
            analysis.append("| Issue Type | Key Observations |")
            analysis.append("|------------|------------------|")
            # Show trends for remaining issues
            for issue_key, instances in sorted_issues[3:]:  # Themes after top 3
                category_points = [p for p in all_pain_points if p['category'] == category]
                common_issues = Counter(p['issue'] for p in category_points if p['issue']).most_common(1)
                observation = f"Most common issue: {common_issues[0][0]}" if common_issues else "No specific issues identified"
                analysis.append(f"| {category.title()} | {observation} |")
            
            # Not Found
            analysis.append("\n# ❓ Not Found")
            analysis.append("\n## Data Gaps")
            analysis.append("- Exact resolution times")
            analysis.append("- Customer follow-up data")
            
            # Uncertainties
            analysis.append("\n# ⚠️ Uncertainties")
            analysis.append("\n## Clarity Issues")
            analysis.append("- Root cause determination for complex issues")
            analysis.append("- Long-term impact assessment")
                
            # Cache and format the results
            result = "\n".join(analysis)
            self.analysis_cache[cache_key] = result
            
            # Print the analysis results for debugging
            print("\n=== Analysis Results ===")
            print(result)
            print("=== End of Analysis ===\n")
            
            return result
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error during analysis: {error_msg}")
            logger.error(f"Current state - prompt_generated: {self.prompt_generated}")
            logger.error(f"Current state - has_prompt: {bool(self.current_analysis_prompt)}")
            logger.error(f"Current state - has_data: {bool(self.current_csv_data)}")
            
            if "top_3_issues" in str(e):
                return "Error during analysis: Issue categorization failed. Please ensure the CSV data contains valid entries."
            elif "current_analysis_prompt" in str(e):
                return "Error during analysis: No valid prompt found. Please generate a new analysis prompt."
            else:
                return f"Error during analysis: {error_msg}\n\nPlease try again or contact support if the issue persists."
        
    def _get_latest_prompt(self) -> str:
        """Get the latest generated prompt from conversation history."""
        latest_prompt = None
        
        # First, look for the most recent complete prompt in conversation history
        for message in reversed(self.conversation_history):
            if message["role"] == "assistant":
                if "Here is your complete analysis prompt:" in message["content"]:
                    latest_prompt = message["content"]
                    break
                elif "Task Introduction" in message["content"]:
                    latest_prompt = message["content"]
                    break
        
        if latest_prompt:
            return self._extract_prompt_content(latest_prompt)
        return None

    def _extract_prompt_content(self, text: str) -> str:
        """Extract the actual prompt content from the generated prompt text."""
        # Look for the prompt content between the header and the final question
        start_markers = [
            "Here is your complete analysis prompt:",
            "[Task Introduction]"
        ]
        end_marker = "Would you like to customize any part of this prompt"
        
        # Find the start of the prompt content
        start_idx = -1
        for marker in start_markers:
            if marker in text:
                start_idx = text.find(marker) + len(marker)
                break
        
        if start_idx == -1:
            return text  # Return original text if no start marker found
            
        # Find the end of the prompt content
        end_idx = text.find(end_marker)
        if end_idx == -1:
            end_idx = len(text)
            
        # Extract and clean the prompt content
        prompt_content = text[start_idx:end_idx].strip()
        return prompt_content

    def _format_prompt_for_display(self, prompt: str) -> str:
        """Format a prompt for the dedicated prompt display area."""
        # Add the required header
        formatted_prompt = "Here is your complete analysis prompt:\n\n"
        
        # If this is a summary of summaries prompt, add the emoji header
        if self.current_mode == 'summary':
            formatted_prompt = "📊 Summary of Summaries Analysis Selected\n\n" + formatted_prompt
            
        # Add the transcript framework if not present
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
        if percentage >= 75: return "Global Impact - Affects most users"
        elif percentage >= 50: return "Wide Impact - Affects many users"
        elif percentage >= 25: return "Moderate Impact - Affects some users"
        return "Limited Impact - Affects few users"
        
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