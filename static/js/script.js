document.addEventListener('DOMContentLoaded', function() {
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const fileUpload = document.getElementById('fileUpload');
    const uploadStatus = document.getElementById('uploadStatus');
    const filePreview = document.getElementById('filePreview');
    const fileInfo = document.getElementById('fileInfo');
    const fileContent = document.getElementById('fileContent');
    const imagePreview = document.getElementById('imagePreview');
    const closePreview = document.getElementById('closePreview');
    const uploadBtn = document.getElementById('uploadBtn');

    // Create active file indicator
    const activeFileIndicator = document.createElement('div');
    activeFileIndicator.className = 'active-file-indicator';
    activeFileIndicator.innerHTML = '<span class="active-file-text">Active File: <span id="activeFileName"></span></span> <button id="clearFileBtn" class="clear-file-btn">×</button>';
    document.querySelector('.chat-container').insertBefore(activeFileIndicator, chatBox);
    
    const activeFileName = document.getElementById('activeFileName');
    const clearFileBtn = document.getElementById('clearFileBtn');
    
    // Hide by default
    activeFileIndicator.style.display = 'none';
    
    // Store uploaded file data
    let currentFileData = null;

    // Function to add a message to the chat
    function addMessage(message, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Split message by paragraphs and create p elements
        const paragraphs = message.split('\n').filter(p => p.trim() !== '');
        paragraphs.forEach(paragraph => {
            const p = document.createElement('p');
            p.textContent = paragraph;
            messageContent.appendChild(p);
        });
        
        messageDiv.appendChild(messageContent);
        chatBox.appendChild(messageDiv);
        
        // Scroll to the bottom of the chat
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Function to add a file message to the chat
    function addFileMessage(fileName, fileType) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const fileMessage = document.createElement('div');
        fileMessage.className = 'file-message';
        
        const fileIcon = document.createElement('i');
        fileIcon.className = 'file-icon fas ' + (fileType === 'pdf' ? 'fa-file-pdf' : 'fa-file-image');
        
        const fileNameSpan = document.createElement('span');
        fileNameSpan.className = 'file-name';
        fileNameSpan.textContent = fileName;
        
        fileMessage.appendChild(fileIcon);
        fileMessage.appendChild(fileNameSpan);
        
        messageContent.appendChild(fileMessage);
        messageDiv.appendChild(messageContent);
        chatBox.appendChild(messageDiv);
        
        // Scroll to the bottom of the chat
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Function to show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing-indicator';
        typingDiv.id = 'typingIndicator';
        
        const indicatorContent = document.createElement('div');
        indicatorContent.className = 'message-content';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            indicatorContent.appendChild(dot);
        }
        
        typingDiv.appendChild(indicatorContent);
        chatBox.appendChild(typingDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Function to remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Function to send message to the server
    async function sendMessage(message, fileContent = '') {
        try {
            showTypingIndicator();
            
            const payload = { message: message };
            
            // Add file content if available
            if (fileContent) {
                payload.file_content = fileContent;
            }
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            removeTypingIndicator();
            
            if (data.error) {
                addMessage('Sorry, there was an error processing your request. Please try again.', false);
            } else {
                addMessage(data.response, false);
            }
            
            // Don't reset file data - it stays in session now
        } catch (error) {
            removeTypingIndicator();
            addMessage('Sorry, there was an error connecting to the server. Please check your connection and try again.', false);
            console.error('Error:', error);
        }
    }

    // Function to upload file
    async function uploadFile(file) {
        try {
            uploadStatus.textContent = 'Uploading...';
            
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.error) {
                uploadStatus.textContent = data.error;
                setTimeout(() => {
                    uploadStatus.textContent = '';
                }, 3000);
                return null;
            } else {
                uploadStatus.textContent = 'Upload successful!';
                setTimeout(() => {
                    uploadStatus.textContent = '';
                }, 3000);
                
                // Store the file data
                currentFileData = data;
                
                // Show file in preview
                showFilePreview(data);
                
                // Add file message to chat
                addFileMessage(file.name, data.file_type);
                
                return data;
            }
        } catch (error) {
            uploadStatus.textContent = 'Upload failed!';
            setTimeout(() => {
                uploadStatus.textContent = '';
            }, 3000);
            console.error('Error:', error);
            return null;
        }
    }

    // Function to show file preview
    function showFilePreview(fileData) {
        fileInfo.textContent = fileData.filename;
        
        // Store data but don't display content
        if (fileData.file_type === 'pdf') {
            // Just store content in hidden element
            fileContent.textContent = fileData.content;
        } else if (['png', 'jpg', 'jpeg'].includes(fileData.file_type)) {
            // Store image URL but don't display
            imagePreview.src = fileData.file_url;
        }
        
        filePreview.classList.add('active');
        
        // Show active file indicator
        activeFileIndicator.style.display = 'flex';
        activeFileName.textContent = fileData.filename;
    }
    
    // Function to clear active file
    function clearActiveFile() {
        fetch('/api/clear-file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            // Hide active file indicator
            activeFileIndicator.style.display = 'none';
            // Reset current file data
            currentFileData = null;
        })
        .catch(error => {
            console.error('Error clearing file:', error);
        });
    }
    
    // Check for active file on page load
    function checkActiveFile() {
        fetch('/api/get-file-status')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.has_active_file) {
                // Show active file indicator
                activeFileIndicator.style.display = 'flex';
                activeFileName.textContent = data.filename;
            }
        })
        .catch(error => {
            console.error('Error checking file status:', error);
        });
    }
    
    // Check for active file when page loads
    checkActiveFile();

    // Event listener for send button
    sendBtn.addEventListener('click', function() {
        const message = userInput.value.trim();
        if (message || currentFileData) {
            if (message) {
                addMessage(message, true);
            }
            
            userInput.value = '';
            
            // Send message with file content if available
            sendMessage(message, currentFileData ? currentFileData.content : '');
            
            // Hide file preview
            filePreview.classList.remove('active');
        }
    });

    // Event listener for Enter key
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const message = userInput.value.trim();
            if (message || currentFileData) {
                if (message) {
                    addMessage(message, true);
                }
                
                userInput.value = '';
                
                // Send message with file content if available
                sendMessage(message, currentFileData ? currentFileData.content : '');
                
                // Hide file preview
                filePreview.classList.remove('active');
            }
        }
    });

    // Event listener for file upload
    fileUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            uploadFile(file);
        }
    });

    // Event listener for close preview button
    closePreview.addEventListener('click', function() {
        filePreview.classList.remove('active');
    });

    // Event listener for clear file button
    clearFileBtn.addEventListener('click', function() {
        clearActiveFile();
    });

    // Focus on input field when page loads
    userInput.focus();
});