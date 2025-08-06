"""
OpenAI Agents SDK implementation.
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

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

# Load spaCy model
try:
    nlp = spacy.load('en_core_web_sm')
except OSError:
    os.system('python -m spacy download en_core_web_sm')
    nlp = spacy.load('en_core_web_sm')
# Load environment variables from .env file in current directory
load_dotenv()

from openai import AsyncOpenAI

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
        self.analysis_cache = {}  # Cache for analysis results
        
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

    async def initialize(self):
        """Initialize the OpenAI client."""
        # Set up API credentials
        api_key = "sk-Of7OL3X1yhEHpsVw-Ahclg"  # New API key
        api_base = "https://caas-gocode-prod.caas-prod.prod.onkatana.net"
        
        print("Using API Key:", api_key)
        print("Using API Base:", api_base)
        
        # Configure OpenAI client
        self.client = AsyncOpenAI(
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
                    return "You've selected to create an initial prompt for analyzing individual transcripts. Could you please specify the domain or topic you want to analyze?"
                elif message.lower() in ['2', 'summary of summaries', 'summary of summaries prompt']:
                    self.current_mode = 'summary'
                    self.prompt_generated = False
                    return "You've selected to create a summary of summaries prompt. Could you please specify the domain or topic you want to analyze from the customer service interactions?"
                elif not any(mode in message.lower() for mode in ['1', '2', 'initial prompt', 'summary of summaries']):
                    return """Would you like to create:
1. An initial prompt for analyzing individual transcripts, or
2. A summary of summaries prompt for analyzing multiple transcript summaries?

Please type '1' or 'initial prompt' for option 1, or '2' or 'summary of summaries' for option 2."""
            
            # Create messages array for the API call
            messages = [
                {"role": "system", "content": """IMPORTANT: Ask only one question at a time. Wait for the user's answer before asking the next question.

You are an expert LLM Prompt Engineer that learns from interactions and maintains context. Follow these guidelines:

FIRST AND MOST IMPORTANT: If this is a new conversation (no mode set), ALWAYS start by asking:
"Would you like to create:
1. An initial prompt for analyzing individual transcripts, or
2. A summary of summaries prompt for analyzing multiple transcript summaries?

Please type '1' or 'initial prompt' for option 1, or '2' or 'summary of summaries' for option 2."

DO NOT proceed with any other questions until the user has chosen one of these options.

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

You are an expert LLM Prompt Engineer specializing in creating highly effective prompts for analyzing customer service interactions. Your mission is to help users design prompts that extract maximum value from analyzing multiple conversation summaries.

For Summary of Summaries analysis, use this exact structure:

Task Introduction:
"You are tasked with analyzing the 'conversation_summary' column from a CSV file containing customer service interaction summaries from GoDaddy.com."

### Quantitative Analysis
- Count and list specific domain-related issues mentioned, with counts and percentages
- Break down each issue into sub-issues or related topics if possible
- Count and list GoDaddy products mentioned, with counts and percentages

### Top 3 Domain Issues
For each issue:
- Frequency (count and percentage)
- Key pain points (bulleted)
- Sub-issues or related challenges
- Representative quotes (3-5 per issue, with attribution)
- Affected products
- Relevant metadata (e.g., channel, region, call duration)

### Specific Recommendations
For each top issue, provide 3 very actionable recommendations, each with a rationale.

### What's Working Well
- List positive patterns, successful features, and effective processes
- Include direct positive customer quotes and specific examples

### Additional Insights
- List any other valuable observations, with supporting data or quotes

### Not Found
- List important elements that were specifically searched for but not found

### Uncertainties
- List areas where data is unclear or ambiguous
- Suggest additional information needed for clarification

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
CSV FILE ANALYSIS: After the user confirms the summary of summaries prompt is satisfactory, let them know they can upload their CSV file using the UI. Once the CSV is uploaded, proceed directly to analysis using the uploaded file—do not ask the user for a file path. Analyze the CSV 'conversation_summary' column only and present the results following the specified output format. Offer to refine or expand the analysis based on user feedback.

Always maintain a helpful, educational tone that builds the user's prompt engineering capabilities while delivering immediate value through your expert prompt design. The more detail the better.

**Important:** You have memory of our previous conversations in this session. Use context from earlier messages to provide better responses."""}
            ]
            messages.extend(self.conversation_history[-10:])  # Include last 10 messages
            
            # Call the API
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages
            )
            
            # Extract and store response
            assistant_response = response.choices[0].message.content
            self.conversation_history.append({"role": "assistant", "content": assistant_response})
            
            # Keep conversation history manageable (last 20 messages)
            if len(self.conversation_history) > 20:
                self.conversation_history = self.conversation_history[-20:]
                
            return assistant_response
            
        except Exception as e:
            print(f"Error in chat with model: {e}")
            return f"Sorry, I encountered an error: {str(e)}"

    def clear_history(self):
        """Clear the conversation history."""
        self.conversation_history = []
        self.prompt_generated = False
        print("Conversation history cleared.")
        
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
        if self.current_csv_data is None:
            return "No CSV file has been loaded yet."
            
        # Use cache if available
        cache_key = id(self.current_csv_data)
        if cache_key in self.analysis_cache:
            return self.analysis_cache[cache_key]
            
        analysis = []
        series = self.current_csv_data['conversation_summary']
        texts = series.dropna().tolist()
        
        # Basic Statistics
        analysis.append("📊 Overview")
        analysis.append(f"Total summaries analyzed: {len(series)}")
        analysis.append(f"Unique summaries: {series.nunique()}")
        missing = series.isna().sum()
        if missing > 0:
            analysis.append(f"⚠️ Missing entries: {missing}")
            
        # Text Statistics
        stats = self._analyze_text_stats(texts)
        analysis.append("\n📝 Content Statistics")
        analysis.append(f"- Average length: {stats['avg_words']:.1f} words (±{stats['std_words']:.1f})")
        analysis.append(f"- Average sentences: {stats['avg_sentences']:.1f} (±{stats['std_sentences']:.1f})")
        analysis.append(f"- Length range: {stats['min_words']} to {stats['max_words']} words")
        
        # Length Distribution
        word_counts = series.str.split().str.len()
        analysis.append("\n📊 Length Distribution")
        bins = [0, 50, 100, 200, 500, float('inf')]
        labels = ['Very Short (0-50)', 'Short (51-100)', 'Medium (101-200)', 'Long (201-500)', 'Very Long (500+)']
        dist = pd.cut(word_counts, bins=bins, labels=labels).value_counts()
        for category, count in dist.items():
            percentage = (count / len(word_counts) * 100)
            analysis.append(f"- {category}: {count} summaries ({percentage:.1f}%)")
            
        # Common Topics
        analysis.append("\n🔍 Common Topics/Phrases")
        topics = self._get_common_topics(texts)
        for topic, count in topics:
            percentage = (count / len(texts) * 100)
            analysis.append(f"- '{topic}': {count} mentions ({percentage:.1f}%)")
            
        # Sentiment Analysis
        analysis.append("\n😊 Sentiment Analysis")
        sentiments = [self._analyze_sentiment(text) for text in tqdm(texts, desc="Analyzing sentiment")]
        avg_polarity = np.mean([s['polarity'] for s in sentiments])
        avg_subjectivity = np.mean([s['subjectivity'] for s in sentiments])
        analysis.append(f"- Overall sentiment: {self._describe_sentiment(avg_polarity)}")
        analysis.append(f"- Subjectivity: {self._describe_subjectivity(avg_subjectivity)}")
        
        # Representative Examples
        analysis.append("\n📋 Representative Examples")
        samples = self._find_representative_samples(texts)
        for i, sample in enumerate(samples, 1):
            sentiment = self._analyze_sentiment(sample)
            analysis.append(f"\nExample {i} (Sentiment: {self._describe_sentiment(sentiment['polarity'])}):")
            analysis.append(sample)
            key_phrases = self._extract_key_phrases(sample)
            if key_phrases:
                analysis.append("Key phrases: " + ", ".join(key_phrases[:5]))
                
        # Cache the results
        result = "\n".join(analysis)
        self.analysis_cache[cache_key] = result
        return result
        
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
        
        return "\n".join(analysis)

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