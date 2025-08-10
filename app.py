from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import os
import asyncio
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
    """Handle CSV analysis request."""
    try:
        analysis = agent.analyze_summaries()
        emit('analysis_result', {'success': True, 'analysis': analysis})
    except Exception as e:
        emit('analysis_result', {'success': False, 'error': str(e)})

@socketio.on('clear_history')
def handle_clear_history():
    """Handle history clearing request."""
    agent.clear_history()
    emit('history_cleared', {'success': True})

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