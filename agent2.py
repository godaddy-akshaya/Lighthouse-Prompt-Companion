"""
GOCAAS Agents SDK implementation.
"""

import os
import asyncio
import pandas as pd
import numpy as np
from typing import List, Optional, Dict, Any, Tuple
from dotenv import load_dotenv
from collections import Counter
from sklearn.feature_extraction.text import CountVectorizer
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
    nlp = spacy.load('en_core_web_sm')
except OSError:
    os.system('python -m spacy download en_core_web_sm')
    nlp = spacy.load('en_core_web_sm')
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
        """Extract common topics using CountVectorizer."""
        vectorizer = CountVectorizer(
            ngram_range=(2, 3),
            stop_words='english',
            min_df=2,
            max_df=0.9
        )
        try:
            X = vectorizer.fit_transform(texts)
            words = vectorizer.get_feature_names_out()
            counts = X.sum(axis=0).A1
            return sorted(zip(words, counts), key=lambda x: x[1], reverse=True)[:n]
        except ValueError:  # If no features were extracted
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
        self.conversation_history.clear()
        self.current_csv_data = None
        self.csv_summary = None
        self.current_mode = None
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
                    return """✨ Individual Transcript Analysis Selected

Here's our base template that will be customized based on your needs:

[transcript] You are tasked with analyzing and summarizing call transcripts (document above) from the customer service center of GoDaddy.com. Each conversation begins with one of the following identifiers: "System", "Bot", "Customer", "Consumer", or "Agent". "Customer" and "Consumer" are synonymous. "Agent" refers to a human support representative, while "Bot" is a chatbot. Some transcripts may contain low-quality speech-to-text conversions, so please interpret carefully and clarify where appropriate. Each turn starts with the role indicated above followed by ':', and ends with '|||'. Identifiable information like names and emails have been redacted as GD_REDACTED_NAME and GD_REDACTED_EMAIL.

To customize this template, I need two pieces of information:

1. What specific category/topic would you like to analyze?
   (For example: email issues, hosting problems, domain transfers, etc.)

2. What aspects would you like summarized?
   (For example: main pain points, customer needs, technical issues, etc.)

I'll incorporate your choices into the template above."""
                elif message.lower() in ['2', 'summary of summaries', 'summary of summaries prompt']:
                    self.current_mode = 'summary'
                    self.prompt_generated = False
                    return """📊 Summary of Summaries Analysis Selected

I'll help you create a prompt to analyze patterns across multiple conversations.

First question:
What key aspects of the customer service interactions would you like to focus on?
(For example: common issues, customer satisfaction drivers, product feedback, etc.)"""
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
        Perform comprehensive analysis of conversation summaries.
        Returns:
            str: Detailed analysis results
        """
        try:
            if self.current_csv_data is None:
                return "No CSV file has been loaded yet."
                
            # Use cache if available
            cache_key = id(self.current_csv_data)
            if cache_key in self.analysis_cache:
                return self.analysis_cache[cache_key]
            
            analysis = []
            series = self.current_csv_data['conversation_summary']
            texts = series.dropna().tolist()
            
            # Quantitative Analysis
            analysis.append("# 📊 Quantitative Analysis\n")
            
            # Issue Tracking
            analysis.append("## Issue Tracking")
            topics = self._get_common_topics(texts)
            analysis.append("\n| Issue Category | Count | Percentage | Example Quote |")
            analysis.append("|----------------|--------|------------|----------------|")
            for topic, count in topics[:5]:  # Top 5 issues
                percentage = (count / len(texts) * 100)
                # Find a relevant quote
                quote = next((text for text in texts if topic in text.lower()), "")
                quote = quote[:100] + "..." if len(quote) > 100 else quote
                analysis.append(f"| {topic} | {count} | {percentage:.1f}% | {quote} |")
            
            # Performance Metrics
            analysis.append("\n## Performance Metrics")
            stats = self._analyze_text_stats(texts)
            sentiments = [self._analyze_sentiment(text) for text in tqdm(texts, desc="Analyzing sentiment")]
            avg_polarity = np.mean([s['polarity'] for s in sentiments])
            
            analysis.append("\n| Metric | Value | Notes |")
            analysis.append("|--------|--------|--------|")
            analysis.append(f"| Average Response Length | {stats['avg_words']:.1f} words | Indicates detail level of responses |")
            analysis.append(f"| Customer Satisfaction | {self._describe_sentiment(avg_polarity)} | Based on sentiment analysis |")
            
            # Top 3 Issues Analysis
            analysis.append("\n# 🎯 Top 3 Issues Analysis")
            
            # Analyze top 3 issues in detail
            for i, (topic, count) in enumerate(topics[:3], 1):
                analysis.append(f"\n## Issue {i}: {topic}")
                
                # Issue Profile
                percentage = (count / len(texts) * 100)
                analysis.append("\n### Issue Profile")
                analysis.append("- **Frequency**: " + f"{count} occurrences ({percentage:.1f}%)")
                analysis.append("- **Severity**: " + self._determine_severity(percentage))
                analysis.append("- **Impact Scope**: " + self._determine_impact(count, len(texts)))
                
                # Detailed Breakdown
                analysis.append("\n### Detailed Breakdown")
                # Find related issues
                related = [t for t, c in topics if topic in t or t in topic][:3]
                analysis.append("**Related Issues:**")
                for rel in related:
                    analysis.append(f"- {rel}")
                
                # Evidence Base
                analysis.append("\n### Evidence Base")
                # Find relevant examples
                examples = [text for text in texts if topic in text.lower()][:3]
                analysis.append("**Representative Quotes:**")
                for j, example in enumerate(examples, 1):
                    analysis.append(f"{j}. > {example[:200]}...")
            
            # Specific Recommendations
            analysis.append("\n# 💡 Specific Recommendations")
            for i, (topic, _) in enumerate(topics[:3], 1):
                analysis.append(f"\n## For {topic}")
                
                analysis.append("\n### Solution Package")
                analysis.append("1. **Immediate Action**: Implement automated detection and response")
                analysis.append("2. **Short-term**: Enhance documentation and user guides")
                analysis.append("3. **Long-term**: Develop preventive measures")
                
                analysis.append("\n### Implementation Guide")
                analysis.append("- **Priority**: High")
                analysis.append("- **Timeline**: 2-3 months")
                analysis.append("- **Success Metrics**: Reduction in related issues")
            
            # What's Working Well
            analysis.append("\n# ✅ What's Working Well")
            positive_texts = [text for text in texts if self._analyze_sentiment(text)['polarity'] > 0.5]
            
            analysis.append("\n## Success Patterns")
            if positive_texts:
                for text in positive_texts[:3]:
                    analysis.append(f"- {text[:150]}...")
            
            # Additional Insights
            analysis.append("\n# 🔍 Additional Insights")
            
            analysis.append("\n## Trend Analysis")
            analysis.append("| Trend | Observation |")
            analysis.append("|-------|-------------|")
            for topic, count in topics[5:8]:  # Next 3 topics after top 5
                analysis.append(f"| {topic} | Mentioned in {count} conversations |")
            
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
                
            # Cache the results
            result = "\n".join(analysis)
            self.analysis_cache[cache_key] = result
            return result
        except Exception as e:
            error_msg = str(e)
            print(f"Error during analysis: {error_msg}")
            return f"Error during analysis: {error_msg}\n\nPlease try again or contact support if the issue persists."
        
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
                    print(conv_agent.analyze_summaries())
                    continue
                    
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