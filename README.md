
# CodeBeasts Generator

This project includes both the frontend React application and the backend Flask API in a single repository. It generates unique pixel art mascots based on GitHub profiles using AI image generation.

## Features
- GitHub profile analysis
- Programming language detection
- AI-powered image generation using DALL-E or Stability AI
- Downloadable and shareable mascot images
- Real-time progress updates

## Project Structure
```
/
├── src/               # Frontend React application
├── api/              # Backend Flask application
└── public/           # Static assets
```

## Setup Instructions

### Frontend Setup
```bash
# Install frontend dependencies
npm install

# Start the development server
npm run dev
```

### Backend Setup
```bash
# Navigate to the api directory
cd api

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Unix or MacOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy the example env file
cp ../.env.example .env

# Update the .env file with your API keys and settings
# You'll need:
# - OpenAI API key for DALL-E
# - Stability API key for Stability AI
# - Langflow configuration (if using)

# Start the Flask server
python main.py
```

The frontend will be available at http://localhost:8080
The backend API will be available at http://localhost:5000

## Environment Variables

Create a `.env` file in the root directory with the following variables:
```
OPENAI_API_KEY=your_openai_api_key_here
STABILITY_API_KEY=your_stability_api_key_here
LANGFLOW_BASE_URL=your_langflow_base_url_here
LANGFLOW_FLOW_ID=your_langflow_flow_id_here
```

## API Endpoints

### POST /chat/process
Processes a GitHub handle and returns user information along with a generated description.

#### Request
```json
{
  "message": "github_username"
}
```

### POST /chat/generate-image
Generates an image based on the provided description using either DALL-E or Stability AI.

#### Request
```json
{
  "prompt": "description_text",
  "model": "dall_e" // or "stability"
}
```

## Image Generation Models

The application supports two AI image generation models:

1. **DALL-E** (Default)
   - OpenAI's DALL-E model for creative and detailed pixel art
   - Requires OPENAI_API_KEY

2. **Stability AI**
   - Alternative model with different artistic style
   - Requires STABILITY_API_KEY

Users can switch between models in the interface before generating images.
