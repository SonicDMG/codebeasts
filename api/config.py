
"""Configuration module for the CodeBeast Generator."""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

# API Configuration
BASE_API_URL = os.getenv('LANGFLOW_BASE_URL')
FLOW_ID = os.getenv('LANGFLOW_FLOW_ID')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
STABILITY_API_KEY = os.getenv('STABILITY_API_KEY')

# Validate required environment variables
if not all([BASE_API_URL, FLOW_ID, OPENAI_API_KEY]):
    raise ValueError("Missing required environment variables. Check .env file.")

# Server Configuration
PORT = int(os.getenv('PORT', '5000'))
