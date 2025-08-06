from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import os
import asyncio
from agent2 import ConversationalAgent
import pandas as pd

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", ping_timeout=300, ping_interval=10)

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
    message = data.get('message', '')
    response = loop.run_until_complete(agent.chat(message))
    emit('response', {'response': response})

@socketio.on('upload_csv')
def handle_csv_upload(data):
    """Handle CSV file upload."""
    try:
        print("\n=== Starting CSV Upload Process ===")
        print("Memory usage before processing:", pd.DataFrame().memory_usage().sum() / 1024 / 1024, "MB")
        
        # Validate input
        csv_content = data.get('csv')
        if not csv_content:
            print("Error: No CSV content received")
            emit('csv_summary', {'success': False, 'error': 'No CSV content received'})
            return
            
        print(f"Received CSV content (length: {len(csv_content)} bytes)")
        
        # Process CSV with explicit error handling
        try:
            import io
            
            # Try to read first few lines to validate format
            print("Validating CSV format...")
            first_lines = csv_content.split('\n')[:5]
            print("Header row:", first_lines[0])
            
            # Fast CSV reading with optimized settings
            print("Speed-reading CSV...")
            df = pd.read_csv(
                io.StringIO(csv_content),
                usecols=['conversation_summary'],
                dtype={'conversation_summary': str},  # Simple string type
                engine='c',  # Using the fast C engine
                na_filter=False,  # Disable NA filtering for speed
                chunksize=1000  # Process in chunks to reduce memory usage
            )
            # Combine chunks efficiently
            chunks = []
            for chunk in df:
                chunks.append(chunk)
            df = pd.concat(chunks, ignore_index=True)
            
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
                
            # Store only the required column and clean data
            print("Processing conversation_summary column...")
            agent.current_csv_data = df[['conversation_summary']].copy()
            agent.current_csv_data['conversation_summary'] = agent.current_csv_data['conversation_summary'].fillna('')
            
            # Generate detailed summary
            print("Generating summary...")
            total_rows = len(agent.current_csv_data)
            valid_rows = agent.current_csv_data['conversation_summary'].str.len().gt(0).sum()
            
            summary = [
                f"✅ Successfully loaded CSV file",
                f"\n📊 Statistics:",
                f"- Total rows: {total_rows}",
                f"- Valid summaries: {valid_rows}",
            ]
            
            if valid_rows < total_rows:
                summary.append(f"⚠️ Found {total_rows - valid_rows} empty or invalid summaries")
            
            # Add samples
            if valid_rows > 0:
                summary.append("\n📝 Sample Summaries:")
                samples = agent.current_csv_data[
                    agent.current_csv_data['conversation_summary'].str.len().gt(0)
                ]['conversation_summary'].head(3)
                
                for i, sample in enumerate(samples, 1):
                    preview = sample[:200] + "..." if len(sample) > 200 else sample
                    summary.append(f"\n{i}. {preview}")
            
            print("Sending success response")
            emit('csv_summary', {'success': True, 'summary': "\n".join(summary)})
            print("Memory usage after processing:", pd.DataFrame().memory_usage().sum() / 1024 / 1024, "MB")
            
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
    socketio.run(app, debug=True, port=8080)