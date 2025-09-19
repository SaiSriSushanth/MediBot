# MediBot - Medical Assistant Chatbot

MediBot is an AI-powered medical assistant chatbot built using Flask and the OpenAI API. It provides general medical information, explains medical terms, and offers health advice.

## Features

- Interactive chat interface
- Medical context-aware responses
- Responsive design for desktop and mobile
- Clear medical disclaimers

## Prerequisites

- Python 3.7+
- OpenAI API key

## Installation

1. Clone this repository or download the files

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set up your OpenAI API key:
   - Open the `.env` file
   - Replace `your_openai_api_key_here` with your actual OpenAI API key

## Usage

1. Start the Flask server:
   ```
   python app.py
   ```

2. Open your web browser and navigate to:
   ```
   http://127.0.0.1:5000/
   ```

3. Start chatting with MediBot by typing your medical questions in the input field

## Important Notes

- MediBot is not a substitute for professional medical advice
- For emergencies, call emergency services immediately
- For specific medical concerns, consult with a qualified healthcare provider
- MediBot cannot diagnose conditions or prescribe medications

## Customization

You can customize the medical context and behavior of the chatbot by modifying the `MEDICAL_CONTEXT` variable in `app.py`.

## License

This project is open source and available for personal and educational use.

## Acknowledgements

- Built with Flask and OpenAI API
- Uses GPT-3.5-Turbo model for generating responses