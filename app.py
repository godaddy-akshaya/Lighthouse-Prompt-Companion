
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
            return jsonify({'success': False, 'error': 'No file content'}), 400
            
        print(f"Received CSV file: {filename} (length: {len(csv_content)} bytes)")
        
        # Use agent2.py's methods directly
        try:
            import io
            csv_buffer = io.StringIO(csv_content)
            
            # Load CSV using agent2.py's method
            if agent.load_csv_from_buffer(csv_buffer, filename):
                # Get summary using agent2.py's method
                summary = agent.get_csv_summary()
                
                response_data = {
                    'success': True,
                    'summary': summary,
                    'socketEvent': 'csv_processed'
                }
                
                # Send WebSocket notification about successful processing
                socketio.emit('csv_processed', response_data)
                return jsonify(response_data), 200
            else:
                return jsonify({
                    'success': False,
                    'error': 'Failed to process CSV file. Please check the format and try again.'
                }), 400
                
        except Exception as e:
            print(f"Error processing CSV: {str(e)}")
            print("Traceback:", traceback.format_exc())
            return jsonify({
                'success': False,
                'error': f'Error processing CSV: {str(e)}'
            }), 400
            
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        print("Traceback:", traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        }), 400
        
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
        
        # Get the analysis directly from agent2.py
        analysis = agent.analyze_summaries()
        
        # Get learned insights
        insights = agent.get_learned_insights()
        
        # Send the analysis result directly
        emit('analysis_result', {
            'success': True,
            'analysis': analysis,
            'insights': insights
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
