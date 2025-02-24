
"""
CodeBeast Generator Web Application

A Flask application that generates pixel art mascots from GitHub profile data
using AI-powered image generation and natural language processing.
"""

import os
import logging

from flask import Flask, send_from_directory
from flask_cors import CORS
import logfire

from dall_e import DallEGenerator
from stability import StabilityGenerator
from routes import register_routes
from config import OPENAI_API_KEY, STABILITY_API_KEY, PORT

# Initialize logging
logfire.configure()
logging.basicConfig(handlers=[logfire.LogfireLoggingHandler()])
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create static directory
os.makedirs('static/temp', exist_ok=True)

# Initialize Flask app
app = Flask(__name__)
CORS(app)
logfire.instrument_flask(app)
app.static_folder = 'static'

# Initialize generators
app.dalle = DallEGenerator(OPENAI_API_KEY)
app.stability = StabilityGenerator(STABILITY_API_KEY)

# Register API routes
register_routes(app)

# Handle SPA routes by serving index.html
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT)
