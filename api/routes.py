"""Module containing all API routes and handlers."""

import os
import logging
import requests
from flask import request, jsonify, g, send_from_directory
from langflow_handler import run_flow
from requests.exceptions import RequestException
from config import FLOW_ID

logger = logging.getLogger(__name__)

def register_routes(app):
    """Register all routes with the Flask app."""
    
    @app.route('/')
    def home():
        """Return API status."""
        return jsonify({
            'status': 'online',
            'message': 'CodeBeast Generator API is running'
        })

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
                image = app.stability.generate_image(prompt)
            else:
                image = app.dalle.generate_image(prompt)

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

        except RequestException as e:
            logger.error("Network error during image generation: %s", str(e))
            return jsonify({
                'error': 'Network error occurred. Please try again later.',
                'status': 'error'
            })
        except ValueError as e:
            logger.error("Value error during image generation: %s", str(e))
            return jsonify({
                'error': 'Invalid input provided. Please check your request.',
                'status': 'error'
            })
        except RuntimeError as e:
            logger.error("Runtime error during image generation: %s", str(e))
            return jsonify({
                'error': 'An unexpected error occurred. Please try again later.',
                'status': 'error'
            })

    @app.route('/api/static/temp')
    def get_codebeasts():
        """Fetch all generated CodeBeasts from the static/temp directory."""
        try:
            temp_dir = os.path.join(app.static_folder, 'temp')
            if not os.path.exists(temp_dir):
                return jsonify([])

            codebeasts = []
            for filename in os.listdir(temp_dir):
                if filename.startswith('generated_') and filename.endswith('.png'):
                    username = filename[10:-4]
                    codebeasts.append({
                        'username': username,
                        'imageUrl': f'/static/temp/{filename}'
                    })

            logger.info("Found %d CodeBeasts in the gallery", len(codebeasts))
            return jsonify(codebeasts)

        except OSError as e:
            logger.error("File system error fetching CodeBeasts: %s", str(e), exc_info=True)
            return jsonify({'error': 'Error accessing the file system. Please try again later.'}), 500

    @app.route('/static/temp/<path:filename>')
    def serve_static(filename):
        """Serve static files from the temp directory with proper headers."""
        response = send_from_directory(os.path.join(app.static_folder, 'temp'), filename)
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
