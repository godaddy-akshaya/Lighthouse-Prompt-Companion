// Initialize Socket.IO connection
const socket = io();

// DOM Elements
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const csvUpload = document.getElementById('csv-upload');
const analyzeButton = document.getElementById('analyze-button');
const clearHistoryButton = document.getElementById('clear-history');
const analysisResults = document.getElementById('analysis-results');

// State
let isWaitingForResponse = false;

// Helper Functions
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
    messageDiv.textContent = content;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    chatContainer.appendChild(indicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return indicator;
}

function removeTypingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
    }
}

// Event Listeners
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isWaitingForResponse) {
        e.preventDefault();
        sendButton.click();
    }
});

sendButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message && !isWaitingForResponse) {
        // Add user message to chat
        addMessage(message, true);
        
        // Clear input and show typing indicator
        messageInput.value = '';
        isWaitingForResponse = true;
        const indicator = showTypingIndicator();
        
        // Send message to server
        socket.emit('message', { message });
        
        // Disable input while waiting
        messageInput.disabled = true;
        sendButton.disabled = true;
    }
});

let currentUploadIndicator = null;

csvUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        console.log('Selected file:', file.name, 'Size:', file.size, 'Type:', file.type);
        
        // Clear any existing indicators
        if (currentUploadIndicator) {
            removeTypingIndicator(currentUploadIndicator);
        }
        
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            addMessage('⚠️ Please select a CSV file', false);
            return;
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            addMessage('⚠️ File is too large. Maximum size is 10MB', false);
            return;
        }
        
        addMessage(`📁 Reading file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`, true);
        currentUploadIndicator = showTypingIndicator();
        
        const reader = new FileReader();
        
        reader.onload = (event) => {
            console.log('File read complete, size:', event.target.result.length);
            
            // Basic CSV validation
            const firstLine = event.target.result.split('\n')[0];
            if (!firstLine.includes('conversation_summary')) {
                addMessage('⚠️ Error: File must contain a "conversation_summary" column', false);
                removeTypingIndicator(currentUploadIndicator);
                currentUploadIndicator = null;
                return;
            }
            
            addMessage('📤 Sending file to server for processing...', true);
            socket.emit('upload_csv', { csv: event.target.result });
            
            // Set a timeout to clear the indicator if no response
            setTimeout(() => {
                if (currentUploadIndicator) {
                    removeTypingIndicator(currentUploadIndicator);
                    currentUploadIndicator = null;
                    addMessage('⚠️ Upload taking longer than 5 minutes. Please try again.', false);
                }
            }, 300000); // 5 minute timeout
        };
        
        reader.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = (event.loaded / event.total * 100).toFixed(1);
                console.log(`Reading file: ${percent}%`);
            }
        };
        
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            addMessage('❌ Error reading file: ' + (error.message || 'Unknown error'), false);
            if (currentUploadIndicator) {
                removeTypingIndicator(currentUploadIndicator);
                currentUploadIndicator = null;
            }
        };
        
        // Start reading the file
        try {
            reader.readAsText(file);
        } catch (error) {
            console.error('Error starting file read:', error);
            addMessage('❌ Error starting file read: ' + (error.message || 'Unknown error'), false);
            if (currentUploadIndicator) {
                removeTypingIndicator(currentUploadIndicator);
                currentUploadIndicator = null;
            }
        }
    }
});

analyzeButton.addEventListener('click', () => {
    socket.emit('analyze_csv');
    addMessage('Analyzing CSV file...', true);
    const indicator = showTypingIndicator();
    analyzeButton.disabled = true;
});

clearHistoryButton.addEventListener('click', () => {
    socket.emit('clear_history');
    chatContainer.innerHTML = '';
    addMessage('Conversation history cleared.', false);
    analyzeButton.disabled = true;
});

// Socket Event Handlers
socket.on('response', (data) => {
    isWaitingForResponse = false;
    messageInput.disabled = false;
    sendButton.disabled = false;
    removeTypingIndicator(chatContainer.querySelector('.typing-indicator'));
    addMessage(data.response);
});

socket.on('csv_summary', (data) => {
    console.log('Received CSV summary response:', data);
    
    // Clear upload indicator
    if (currentUploadIndicator) {
        removeTypingIndicator(currentUploadIndicator);
        currentUploadIndicator = null;
    }
    
    if (data.success) {
        addMessage('✅ CSV file processed successfully. Summary:', false);
        addMessage(data.summary, false);
        analyzeButton.disabled = false;  // Enable analyze button only after successful upload
        
        // Add instruction for next step
        addMessage('👉 Click "Analyze CSV" to perform detailed analysis', false);
    } else {
        addMessage(`❌ Error processing CSV: ${data.error}`, false);
        addMessage('Please try uploading the file again.', false);
        analyzeButton.disabled = true;
    }
});

socket.on('analysis_result', (data) => {
    removeTypingIndicator(chatContainer.querySelector('.typing-indicator'));
    analyzeButton.disabled = false;
    if (data.success) {
        analysisResults.innerHTML = `<div class="analysis-content">${data.analysis}</div>`;
    } else {
        analysisResults.innerHTML = `<p class="text-red-500">Error during analysis: ${data.error}</p>`;
    }
});

socket.on('history_cleared', (data) => {
    if (data.success) {
        analysisResults.innerHTML = '<p class="text-gray-600">Upload a CSV file and run analysis to see results here.</p>';
    }
});