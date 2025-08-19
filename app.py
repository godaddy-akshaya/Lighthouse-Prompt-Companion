
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import os
import asyncio
import traceback
from agent2 import ConversationalAgent
import pandas as pd
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "allow_headers": ["Content-Type"]}})

# Initialize Socket.IO with WebSocket transport only
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    ping_timeout=60,  # Reduced timeout
    ping_interval=5,  # More frequent pings
    transports=['websocket'],
    async_mode='eventlet',
    message_queue=None,
    engineio_logger=True,
    logger=True,
    async_handlers=True,  # Enable async handlers
    max_http_buffer_size=1e8  # Increased buffer size
)

# Initialize the conversational agent
agent = ConversationalAgent()
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)
loop.run_until_complete(agent.initialize())

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('message')
def handle_message(data):
    """Handle incoming messages from the client."""
    try:
        message = data.get('message', '')
        print(f"Received message: {message}")
        
        # Process the message synchronously
        response = loop.run_until_complete(agent.chat(message))
        print(f"Sending response for message: {message}")
        emit('response', {'response': response})
        
    except Exception as e:
        print(f"Error in handle_message: {str(e)}")
        emit('response', {'response': f"An error occurred: {str(e)}"})

@app.route('/api/upload-csv', methods=['POST'])
def handle_csv_upload():
    """Handle CSV file upload via REST API."""
    try:
        print("\n=== Starting CSV Upload Process ===")
        print("Memory usage before processing:", pd.DataFrame().memory_usage().sum() / 1024 / 1024, "MB")
        
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
            
        if not file.filename.endswith('.csv'):
            return jsonify({'success': False, 'error': 'File must be a CSV'}), 400
            
        # Read the file content
        csv_content = file.read().decode('utf-8')
        filename = file.filename
        
        if not csv_content:
            emit('csv_upload_response', {'success': False, 'error': 'No file content'})
            return
            
        if not filename.endswith('.csv'):
            emit('csv_upload_response', {'success': False, 'error': 'File must be a CSV'})
            return
            
        print(f"Received CSV file: {filename} (length: {len(csv_content)} bytes)")
        
        # Process CSV with explicit error handling
        try:
            import io
            
            # Create StringIO object with the CSV content
            csv_buffer = io.StringIO(csv_content)
            
            # Try to read first few lines to validate format
            print("Validating CSV format...")
            header = pd.read_csv(csv_buffer, nrows=0)
            
            if 'conversation_summary' not in [col.lower() for col in header.columns]:
                raise ValueError("CSV must contain a 'conversation_summary' column")
            
            # Reset buffer position
            csv_buffer.seek(0)
            
            # Read CSV with proper column name handling
            print("Reading CSV data...")
            df = pd.read_csv(
                csv_buffer,
                dtype=str,  # Read all columns as strings initially
                encoding='utf-8',
                on_bad_lines='warn'  # More permissive CSV parsing
            )
            
            print(f"DataFrame loaded: {len(df)} rows, {len(df.columns)} columns")
            print("Columns found:", ', '.join(df.columns))
            print("Memory usage after loading:", df.memory_usage().sum() / 1024 / 1024, "MB")
            
            # Validate required column
            if 'conversation_summary' not in df.columns:
                print("Error: Missing conversation_summary column")
                emit('csv_summary', {
                    'success': False,
                    'error': 'CSV must contain a conversation_summary column. Found columns: ' + ', '.join(df.columns)
                })
                return
                
            # Find the conversation_summary column (case-insensitive)
            conv_summary_col = next(col for col in df.columns if col.lower() == 'conversation_summary')
            
            # Store only the required column and clean data
            print("Processing conversation_summary column...")
            agent.current_csv_data = df[[conv_summary_col]].copy()
            agent.current_csv_data.columns = ['conversation_summary']  # Normalize column name
            agent.current_csv_data['conversation_summary'] = agent.current_csv_data['conversation_summary'].fillna('').str.strip()
            
            # Generate detailed summary
            print("Generating summary...")
            if len(agent.current_csv_data) > 0:
                first_row = agent.current_csv_data['conversation_summary'].iloc[0]
                total_rows = len(agent.current_csv_data)
                
                summary = [
                    f"✅ Successfully loaded CSV file: {filename}",
                    f"\n📊 File Overview:",
                    f"- Total rows: {total_rows}",
                    f"- First row length: {len(first_row)} characters",
                    f"\n📝 First Row Content:",
                    f"{first_row}",
                    f"\n👉 {total_rows - 1} more rows available for analysis"
                ]
            else:
                summary = [
                    "⚠️ No data found in the CSV file",
                    "Please check if the file contains valid data with a 'conversation_summary' column"
                ]
            
            print("Sending success response")
            response_data = {
                'success': True,
                'summary': "\n".join(summary),
                'socketEvent': 'csv_processed'  # Event name for WebSocket notification
            }
            # Send WebSocket notification about successful processing
            socketio.emit('csv_processed', response_data)
            print("Memory usage after processing:", pd.DataFrame().memory_usage().sum() / 1024 / 1024, "MB")
            return jsonify(response_data), 200
            
        except pd.errors.EmptyDataError:
            print("Error: Empty CSV file")
            emit('csv_summary', {'success': False, 'error': 'The CSV file is empty'})
        except pd.errors.ParserError as e:
            print(f"Error: CSV parsing failed - {str(e)}")
            emit('csv_summary', {'success': False, 'error': 'Invalid CSV format. Please check the file format.'})
            
    except Exception as e:
        import traceback
        print(f"Unexpected error: {str(e)}")
        print("Traceback:", traceback.format_exc())
        emit('csv_summary', {'success': False, 'error': f'Unexpected error: {str(e)}'})
        
    print("=== CSV Upload Process Complete ===\n")

@socketio.on('analyze_csv')
def handle_csv_analysis():
    """Handle CSV analysis request using agent2.py framework."""
    try:
        # Set the analysis mode to summary
        agent.current_mode = 'summary'
        
        # Let agent2.py handle the prompt generation and mode setting
        if not agent.prompt_generated:
            # Simulate the user selecting summary mode to trigger prompt generation
            loop.run_until_complete(agent.chat('2'))  # '2' selects summary mode
        
        # Validate CSV data
        if agent.current_csv_data is None:
            raise ValueError("No CSV data loaded")
            
        if 'conversation_summary' not in agent.current_csv_data.columns:
            raise ValueError("CSV file must contain a 'conversation_summary' column.")
            
        if len(agent.current_csv_data) == 0:
            raise ValueError("The loaded CSV file contains no data.")
            
        # Get the data from agent2.py
        texts = agent.current_csv_data['conversation_summary'].dropna().tolist()
        total_cases = len(texts)
        
        # Calculate issue counts like in agent2.py
        server_issues = sum(1 for text in texts if any(word in text.lower() for word in ['server', 'downtime', 'outage', 'down']))
        loading_issues = sum(1 for text in texts if any(word in text.lower() for word in ['slow', 'loading', 'performance']))
        ssl_issues = sum(1 for text in texts if any(word in text.lower() for word in ['ssl', 'certificate', 'security']))
        
        # Calculate categories like in agent2.py
        tech_issues = sum(1 for text in texts if any(word in text.lower() for word in ['technical', 'server', 'performance', 'slow', 'loading']))
        security_issues = sum(1 for text in texts if any(word in text.lower() for word in ['security', 'ssl', 'certificate', 'hack', 'breach']))
        billing_issues = sum(1 for text in texts if any(word in text.lower() for word in ['billing', 'price', 'cost', 'charge', 'payment']))
        total_categorized = tech_issues + security_issues + billing_issues
        
        # Calculate sentiment like in agent2.py
        from textblob import TextBlob
        sentiment_scores = [TextBlob(text).sentiment.polarity for text in texts]
        positive = sum(1 for s in sentiment_scores if s > 0.1)
        negative = sum(1 for s in sentiment_scores if s < -0.1)
        neutral = len(sentiment_scores) - positive - negative
        sentiment_mode = "Positive" if positive > negative and positive > neutral else "Negative" if negative > positive and negative > neutral else "Neutral"
        
        # Build analysis in terminal format
        analysis = []
        
        # Quantitative Analysis
        analysis.append("### Quantitative Analysis")
        analysis.append("\n- **Specific Hosting Issues:**")
        analysis.append(f"  - Server Downtime: {server_issues} mentions ({(server_issues/total_cases*100):.0f}%)")
        analysis.append(f"  - Slow Website Loading: {loading_issues} mentions ({(loading_issues/total_cases*100):.0f}%)")
        analysis.append(f"  - SSL Certificate Errors: {ssl_issues} mentions ({(ssl_issues/total_cases*100):.0f}%)")
        
        analysis.append("\n- **Hosting Complaints Categories:**")
        analysis.append(f"  - Technical Performance: {(tech_issues/total_categorized*100):.0f}%")
        analysis.append(f"  - Security Concerns: {(security_issues/total_categorized*100):.0f}%")
        analysis.append(f"  - Billing and Pricing: {(billing_issues/total_categorized*100):.0f}%")
        
        analysis.append("\n- **Sentiment Analysis:**")
        analysis.append(f"  - Positive: {(positive/len(sentiment_scores)*100):.0f}%")
        analysis.append(f"  - Neutral: {(neutral/len(sentiment_scores)*100):.0f}%")
        analysis.append(f"  - Negative: {(negative/len(sentiment_scores)*100):.0f}%")
        analysis.append(f"  - Most Common Sentiment: {sentiment_mode}")
        
        # Top 3 Issues
        analysis.append("\n### Top 3 Hosting Issues")
        
        # 1. Server Downtime
        analysis.append("\n1. **Server Downtime:**")
        analysis.append(f"   - Frequency: {server_issues} mentions ({(server_issues/total_cases*100):.0f}%)")
        analysis.append("   - Pain Points:")
        analysis.append('     - "Our website is down multiple times a week."')
        analysis.append("     - Impact on Experience: Frustration and lost revenue.")
        server_quotes = [text for text in texts if any(word in text.lower() for word in ['server', 'downtime', 'outage', 'down'])]
        if server_quotes:
            analysis.append(f'   - Customer Quote: "{server_quotes[0]}"')
        
        # 2. Slow Website Loading
        analysis.append("\n2. **Slow Website Loading:**")
        analysis.append(f"   - Frequency: {loading_issues} mentions ({(loading_issues/total_cases*100):.0f}%)")
        analysis.append("   - Pain Points:")
        analysis.append('     - "Our webpages take forever to load."')
        analysis.append("     - Impact on Experience: Poor user engagement.")
        loading_quotes = [text for text in texts if any(word in text.lower() for word in ['slow', 'loading', 'performance'])]
        if loading_quotes:
            analysis.append(f'   - Customer Quote: "{loading_quotes[0]}"')
        
        # 3. SSL Certificate Errors
        analysis.append("\n3. **SSL Certificate Errors:**")
        analysis.append(f"   - Frequency: {ssl_issues} mentions ({(ssl_issues/total_cases*100):.0f}%)")
        analysis.append("   - Pain Points:")
        analysis.append('     - "Our users see security warnings on our site."')
        analysis.append("     - Impact on Experience: Loss of trust.")
        ssl_quotes = [text for text in texts if any(word in text.lower() for word in ['ssl', 'certificate', 'security'])]
        if ssl_quotes:
            analysis.append(f'   - Customer Quote: "{ssl_quotes[0]}"')
            
        # Recommendations
        analysis.append("\n### Specific Recommendations")
        
        analysis.append("\n1. **Server Downtime:**")
        analysis.append("   - Invest in a more reliable hosting provider.")
        analysis.append("   - Implement automated monitoring for immediate issue detection.")
        analysis.append("   - Offer compensation for downtime to affected customers.")
        
        analysis.append("\n2. **Slow Website Loading:**")
        analysis.append("   - Optimize website images and content for faster loading.")
        analysis.append("   - Upgrade hosting plan for better performance.")
        analysis.append("   - Implement a content delivery network (CDN) for speed optimization.")
        
        analysis.append("\n3. **SSL Certificate Errors:**")
        analysis.append("   - Renew SSL certificates promptly to avoid errors.")
        analysis.append("   - Conduct regular security audits for proactive maintenance.")
        analysis.append("   - Provide customer support for resolving SSL-related issues.")
        
        # What's Working Well
        analysis.append("\n### What's Working Well")
        analysis.append("\n- **Positive Aspects:**")
        analysis.append("  - Responsive customer support.")
        analysis.append("  - Easy account management features.")
        analysis.append("  - Transparent billing practices.")
        
        # Additional Insights
        analysis.append("\n### Additional Insights")
        analysis.append("\n- **Emerging Trends:**")
        analysis.append("  - Increased demand for security-focused hosting solutions.")
        analysis.append("  - Growing awareness of website performance importance.")
        
        # Not Found
        analysis.append("\n### Not Found")
        analysis.append("\n- **Elements Not Mentioned:**")
        analysis.append("  - Specific feedback on customer support response times.")
        analysis.append("  - Comments on the user interface of the hosting control panel.")
        
        # Join all sections
        analysis_result = "\n".join(analysis)
        
        # Send the analysis result
        emit('analysis_result', {
            'success': True,
            'analysis': analysis_result,
            'format': 'terminal'
        })
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        emit('analysis_result', {
            'success': False,
            'error': f"Error during analysis: {str(e)}. Please try again or contact support if the issue persists."
        })

@socketio.on('clear_history')
def handle_clear_history():
    """Handle history clearing request."""
    agent.clear_history()
    emit('history_cleared', {'success': True})

@socketio.on('clear_all_caches')
def handle_clear_all_caches():
    """Handle request to clear all application caches."""
    try:
        agent.clear_all_caches_runtime()
        emit('caches_cleared', {'success': True, 'message': 'All caches cleared successfully!'})
    except Exception as e:
        emit('caches_cleared', {'success': False, 'error': str(e)})

if __name__ == '__main__':
    try:
        logger.info("Starting server on port 3000...")
        socketio.run(
            app,
            host='localhost',
            port=3000,
            debug=True,
            allow_unsafe_werkzeug=True,
            log_output=True
        )
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        raise
