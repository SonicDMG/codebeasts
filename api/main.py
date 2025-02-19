
"""
CodeBeast Generator Web Application

A Flask application that generates pixel art mascots from GitHub profile data
using AI-powered image generation and natural language processing.
"""

import os
import logging
from typing import Dict, Any

from flask import Flask, render_template, request, jsonify, g
import requests
import logfire
from dotenv import load_dotenv
from dall_e import DallEGenerator
from stability import StabilityGenerator
from flask_cors import CORS

# Load environment variables
load_dotenv(override=True)

# Initialize logging
logfire.configure()
logging.basicConfig(handlers=[logfire.LogfireLoggingHandler()])
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Configuration from environment
BASE_API_URL = os.getenv('LANGFLOW_BASE_URL')
FLOW_ID = os.getenv('LANGFLOW_FLOW_ID')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
STABILITY_API_KEY = os.getenv('STABILITY_API_KEY')
if not all([BASE_API_URL, FLOW_ID, OPENAI_API_KEY]):
    raise ValueError("Missing required environment variables. Check .env file.")

# Initialize Flask app
app = Flask(__name__)
CORS(app)
logfire.instrument_flask(app)
app.static_folder = 'static'

# Initialize generators
dalle = DallEGenerator(OPENAI_API_KEY)
stability = StabilityGenerator(STABILITY_API_KEY)

def run_flow(
    message: str,
    endpoint: str,
    output_type: str = "chat",
    input_type: str = "chat",
    tweaks: Dict[str, Any] = None,
    api_key: str = None
) -> Dict[str, Any]:
    """Execute a Langflow flow with the given parameters."""
    api_url = f"{BASE_API_URL}/api/v1/run/{endpoint}"

    payload = {
        "input_value": message,
        "output_type": output_type,
        "input_type": input_type,
        "session_id": message.lower()
    }

    if tweaks:
        payload["tweaks"] = tweaks

    headers = {"x-api-key": api_key} if api_key else None

    response = requests.post(api_url, json=payload, headers=headers, timeout=120)
    response_data = response.json()
    full_response = response_data['outputs'][0]['outputs'][0]['results']['message']['text']
    data = parse_langflow_response(full_response)

    if hasattr(g, 'user_data'):
        g.user_data = data

    return data

def parse_langflow_response(full_response: str) -> Dict[str, Any]:
    """Parse the response from Langflow into structured data."""
    parts = full_response.split('|')
    
    data = {
        'languages': [],
        'prompt': "",
        'github_user_name_url': "",
        'num_repositories': 0,
        'animal_selection': []
    }

    try:
        # Parse languages
        data['languages'] = [
            lang.strip().strip("'\"")
            for lang in parts[0].split(':')[1].strip('[]').split(',')
            if lang.strip()
        ]

        # Parse other fields
        data['prompt'] = parts[1].split(':', 1)[1].strip()
        data['github_user_name_url'] = parts[2].split(':', 1)[1].strip()
        data['num_repositories'] = int(parts[3].split(':', 1)[1].strip())
        
        # Parse animal selection if it exists
        if len(parts) > 4:
            animals_part = parts[4].split(':', 1)[1].strip()
            animals_str = animals_part.strip('[]')
            if animals_str:
                try:
                    animal_entries = eval(animals_part)
                    data['animal_selection'] = [
                        (entry[0], entry[1]) for entry in animal_entries
                    ]
                except (SyntaxError, ValueError):
                    pass

    except (IndexError, ValueError):
        pass

    return data

@app.route('/')
def home():
    """Render the main application interface."""
    return render_template('index.html')

@app.route('/chat/process', methods=['POST'])
def process_chat():
    """Process GitHub handle and generate AI response."""
    if hasattr(g, 'user_data'):
        delattr(g, 'user_data')

    data = request.json
    message = data.get('message')

    try:
        user_data = run_flow(
            message=message,
            endpoint=FLOW_ID
        )

        return jsonify({
            'response': user_data['prompt'],
            'languages': user_data.get('languages', []),
            'github_url': user_data.get('github_user_name_url', ''),
            'num_repositories': user_data.get('num_repositories', 0),
            'animal_selection': user_data.get('animal_selection', []),
            'status': 'success'
        })

    except requests.RequestException as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        })

@app.route('/chat/generate-image', methods=['POST'])
def generate_image():
    """Generate pixel art mascot from AI description."""
    data = request.json
    prompt = data.get('prompt')
    model = data.get('model', 'dall_e')
    github_handle = data.get('handle', 'unknown')

    try:
        if model == 'stability':
            image = stability.generate_image(prompt)
        else:
            image = dalle.generate_image(prompt)

        if image is None:
            raise RuntimeError("Failed to generate image")

        img_filename = f'generated_{github_handle}.png'
        img_path = os.path.join(app.static_folder, 'temp', img_filename)
        os.makedirs(os.path.dirname(img_path), exist_ok=True)
        image.save(img_path)

        return jsonify({
            'image_url': f'static/temp/{img_filename}',
            'status': 'success'
        })

    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        })

if __name__ == '__main__':
    port = int(os.getenv('PORT', '5000'))
    os.makedirs('static/temp', exist_ok=True)
    app.run(host='0.0.0.0', port=port)

