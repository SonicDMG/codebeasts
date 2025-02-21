
# CodeBeasts Generator

<div align="center">
  <img src="/lovable-uploads/6e48cfe8-7c75-4565-939d-f665321ddd3a.png" alt="CodeBeasts Logo" width="300px" />
</div>

Turn your GitHub profile into a unique AI-generated creature! This project analyzes your GitHub activity and programming languages to create a personalized pixel art mascot using AI image generation.

## Live Demo
Visit [CodeBeasts](https://codebeasts.lovable.app/) to try it out!

## Features
- GitHub profile analysis
- Programming language detection
- AI-powered image generation using Stability AI
- Downloadable and shareable mascot images
- Real-time progress updates
- Pixel art style mascots with unique personalities

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
cp .env.example .env

# Update the .env file with your API keys and settings
# You'll need:
# - Stability API key for Stability AI
```

The frontend will be available at http://localhost:8080
The backend API will be available at http://localhost:5000

## Environment Variables

Create a `.env` file in the root directory with the following variables:
```
STABILITY_API_KEY=your_stability_api_key_here
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
Generates an image based on the provided description using Stability AI.

#### Request
```json
{
  "prompt": "description_text",
  "model": "stability"
}
```

## Image Generation Model

The application uses Stability AI's latest model for image generation:

- **Stability AI SD 3**
  - Advanced model optimized for pixel art generation
  - Creates unique, personalized mascots
  - Requires STABILITY_API_KEY

## Contributing

Feel free to open issues and submit pull requests to help improve CodeBeasts!

