from flask import Flask, request, jsonify, render_template, url_for, send_from_directory, session
import os
import openai
import uuid
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import PyPDF2
from PIL import Image
import io
import pytesseract

# Load environment variables
load_dotenv()

# Set up OpenAI API
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize Flask app
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.secret_key = 'medical_bot_secret_key'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size
app.config['ALLOWED_EXTENSIONS'] = {'pdf', 'png', 'jpg', 'jpeg'}
app.secret_key = os.getenv("SECRET_KEY", "dev_secret_key")  # For session management

# Create uploads folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def extract_text_from_pdf(file_path):
    text = ""
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            text += page.extract_text() + "\n"
    return text

def process_image(file_path):
    try:
        image = Image.open(file_path)
        # For a real implementation, you would use OCR here
        # This is a placeholder for demonstration
        return f"[Image content from {os.path.basename(file_path)}]"
    except Exception as e:
        return f"Error processing image: {str(e)}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(file_path)
            
            file_content = ""
            file_type = filename.rsplit('.', 1)[1].lower()
            
            if file_type == 'pdf':
                file_content = extract_text_from_pdf(file_path)
            elif file_type in ['png', 'jpg', 'jpeg']:
                file_content = process_image(file_path)
            
            file_url = url_for('uploaded_file', filename=unique_filename, _external=True)
            
            # Store file data in session
            session['file_data'] = {
                "filename": unique_filename,
                "file_url": file_url,
                "content": file_content,
                "file_type": file_type
            }
            
            return jsonify({
                "success": True,
                "filename": unique_filename,
                "file_url": file_url,
                "content": file_content,
                "file_type": file_type
            })
        else:
            return jsonify({"error": "File type not allowed"}), 400
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        file_content = data.get('file_content', '')
        
        # Get file content from session if not provided in request
        if not file_content and 'file_data' in session:
            file_content = session['file_data'].get('content', '')
        
        if not user_message and not file_content:
            return jsonify({"error": "No message or file content provided"}), 400
        
        # Create the conversation with the medical context
        messages = [
            {"role": "system", "content": "You are a helpful medical assistant that can analyze medical documents and answer questions about them."}
        ]
        
        # Add file content if available
        if file_content:
            messages.append({
                "role": "user", 
                "content": f"I've uploaded a file with the following content. Please analyze it from a medical perspective:\n\n{file_content}"
            })
        
        # Add user message
        if user_message:
            messages.append({"role": "user", "content": user_message})
        
        # Get response from OpenAI
        response = openai.chat.completions.create(
           # model="gpt-3.5-turbo",
            model="gpt-4o",
            messages=messages,
            max_tokens=500,
            temperature=0.7,
        )
        
        bot_response = response.choices[0].message.content
        
        return jsonify({"response": bot_response})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/clear-file', methods=['POST'])
def clear_file():
    # Clear file data from session
    if 'file_data' in session:
        session.pop('file_data')
    return jsonify({'success': True})

@app.route('/api/get-file-status', methods=['GET'])
def get_file_status():
    # Return current file status from session
    file_data = session.get('file_data')
    if file_data:
        return jsonify({
            'has_active_file': True,
            'filename': file_data.get('filename'),
            'file_type': file_data.get('file_type')
        })
    else:
        return jsonify({
            'has_active_file': False
        })

if __name__ == '__main__':
    app.run(debug=True)