
# CodeBeasts Generator

This project includes both the frontend React application and the backend Flask API in a single repository.

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

# Copy the example env file and add your OpenAI API key
cp ../.env.example .env

# Start the Flask server
python main.py
```

The frontend will be available at http://localhost:8080
The backend API will be available at http://localhost:5000

## Environment Variables

Create a `.env` file in the root directory with the following variables:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## API Endpoints

### POST /chat/process
Processes a GitHub handle and returns user information along with a generated description.

### POST /chat/generate-image
Generates an image based on the provided description using DALL-E.
