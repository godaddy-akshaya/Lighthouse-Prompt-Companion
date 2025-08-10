// Initialize Socket.IO connection with WebSocket transport only
const socket = io('http://localhost:3000', {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    forceNew: true,
    timeout: 60000
});

// Socket connection event handlers
socket.on('connect', () => {
    console.log('Connected to WebSocket');
    addMessage('✅ Connected to server', false);
});

socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket');
    addMessage('❌ Disconnected from server. Attempting to reconnect...', false);
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    addMessage('❌ Connection error. Retrying...', false);
});

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
    
    // Check if the content might be markdown (contains common markdown indicators)
    const mightBeMarkdown = !isUser && (
        content.includes('#') || 
        content.includes('```') || 
        content.includes('*') || 
        content.includes('- ') ||
        content.includes('1. ')
    );
    
    if (mightBeMarkdown) {
        // Convert markdown to HTML
        messageDiv.innerHTML = marked.parse(content);
        
        // If this looks like a prompt, also update the prompt display
        if (content.includes('Task:') || (content.includes('###') && content.includes('Quantitative Analysis'))) {
            console.log('Detected prompt content, updating prompt display');
            const promptDisplay = document.getElementById('prompt-display');
            const copyButton = document.getElementById('copy-prompt');
            
            if (promptDisplay && copyButton) {
                promptDisplay.innerHTML = marked.parse(content);
                copyButton.classList.remove('hidden');
                
                // Add copy functionality
                copyButton.onclick = () => {
                    navigator.clipboard.writeText(content).then(() => {
                        const originalText = copyButton.textContent;
                        copyButton.textContent = 'Copied!';
                        copyButton.classList.add('bg-green-500');
                        copyButton.classList.remove('bg-blue-500');
                        
                        setTimeout(() => {
                            copyButton.textContent = originalText;
                            copyButton.classList.remove('bg-green-500');
                            copyButton.classList.add('bg-blue-500');
                        }, 2000);
                    });
                };
                
                // Highlight code blocks
                Prism.highlightAll();
            } else {
                console.warn('Prompt display elements not found');
            }
        }
    } else {
        messageDiv.textContent = content;
    }
    
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
        
        // Add timeout warning after 10 seconds
        const timeoutWarning = setTimeout(() => {
            if (isWaitingForResponse) {
                addMessage('Still processing your request... This might take a moment.', false);
            }
        }, 10000);
        
        // Clear timeout warning when response is received
        socket.once('response', () => {
            clearTimeout(timeoutWarning);
        });
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
            
            // Basic CSV validation and preprocessing
            const lines = event.target.result.split('\n');
            const firstLine = lines[0].toLowerCase(); // Convert header to lowercase for case-insensitive check
            
            if (!firstLine.includes('conversation_summary')) {
                addMessage('⚠️ Error: File must contain a "conversation_summary" column', false);
                removeTypingIndicator(currentUploadIndicator);
                currentUploadIndicator = null;
                return;
            }
            
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('file', file);

            // Add upload status message
            const uploadStatusMsg = addMessage('📤 Uploading CSV file...', false);
            const progressMsg = addMessage('⏳ Processing...', false);

            // Use fetch API for file upload with proper error handling
            fetch('/api/upload-csv', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    uploadStatusMsg.textContent = '✅ CSV file uploaded successfully!';
                    addMessage('📊 Summary of uploaded data:', false);
                    addMessage(data.summary, false);
                    analyzeButton.disabled = false;
                } else {
                    uploadStatusMsg.textContent = `❌ Upload failed: ${data.error}`;
                    progressMsg.remove();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                uploadStatusMsg.textContent = '❌ Upload failed. Please try again.';
                progressMsg.remove();
            });
            
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
    
    // Clear prompt display
    const promptDisplay = document.getElementById('prompt-display');
    promptDisplay.innerHTML = '<p class="text-gray-600">Your generated prompt will appear here after answering the questions.</p>';
    document.getElementById('copy-prompt').classList.add('hidden');
});

// Socket Event Handlers
socket.on('response', (data) => {
    isWaitingForResponse = false;
    messageInput.disabled = false;
    sendButton.disabled = false;
    removeTypingIndicator(chatContainer.querySelector('.typing-indicator'));
    addMessage(data.response);

    // Highlight any code blocks in the response
    if (!isUser && data.response.includes('```')) {
        setTimeout(() => Prism.highlightAll(), 100);
    }
});

// Listen for CSV processing completion via WebSocket
socket.on('csv_processed', (data) => {
    console.log('Received CSV processing notification:', data);
    
    // Clear upload indicator
    if (currentUploadIndicator) {
        removeTypingIndicator(currentUploadIndicator);
        currentUploadIndicator = null;
    }
    
    // Find and remove the processing message
    const processingMessages = document.querySelectorAll('.message');
    processingMessages.forEach(msg => {
        if (msg.textContent === '⏳ Processing...') {
            msg.remove();
        }
    });
    
    if (data.success) {
        // Update the UI with success messages
        addMessage('✅ CSV file processed successfully!', false);
        addMessage('📊 Summary of uploaded data:', false);
        addMessage(data.summary, false);
        analyzeButton.disabled = false;  // Enable analyze button
        
        // Add instruction for next step
        addMessage('👉 Click "Analyze CSV" to perform detailed analysis', false);
        
        // Visual feedback - briefly highlight the analyze button
        analyzeButton.classList.add('highlight-button');
        setTimeout(() => {
            analyzeButton.classList.remove('highlight-button');
        }, 2000);
    } else {
        addMessage(`❌ Error processing CSV: ${data.error}`, false);
        addMessage('Please try uploading the file again.', false);
        analyzeButton.disabled = true;
    }
});

socket.on('analysis_result', (data) => {
    removeTypingIndicator(chatContainer.querySelector('.typing-indicator'));
    analyzeButton.disabled = false;
    const printButton = document.getElementById('print-analysis');
    
    if (data.success) {
        // Convert markdown to HTML with Google Doc styling
        const htmlContent = marked.parse(data.analysis);
        analysisResults.innerHTML = htmlContent;
        
        // Show print button
        printButton.classList.remove('hidden');
        printButton.onclick = () => {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                <head>
                    <title>Analysis Results</title>
                    <style>
                        ${document.querySelector('style').innerHTML}
                        body { padding: 2rem; }
                        @media print {
                            body { padding: 0; }
                            .analysis-content { box-shadow: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="analysis-content">${htmlContent}</div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        };
        
        // Highlight code blocks
        Prism.highlightAll();
    } else {
        analysisResults.innerHTML = `
            <div class="warning-section">
                <h3>❌ Error during analysis</h3>
                <p>${data.error}</p>
            </div>
        `;
        printButton.classList.add('hidden');
    }
});

socket.on('history_cleared', (data) => {
    if (data.success) {
        analysisResults.innerHTML = '<p class="text-gray-600">Upload a CSV file and run analysis to see results here.</p>';
    }
});