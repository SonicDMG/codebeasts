
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

@app.route('/chat/process', methods=['POST'])
def process_github():
    data = request.json
    github_handle = data.get('message')
    
    try:
        # Fetch GitHub user data
        github_url = f'https://api.github.com/users/{github_handle}/repos'
        response = requests.get(github_url)
        repos = response.json()
        
        if response.status_code != 200:
            return jsonify({
                'status': 'error',
                'error': 'GitHub profile not found'
            })

        # Process languages
        languages = set()
        for repo in repos:
            if repo.get('language'):
                languages.add(repo.get('language'))
        
        # Generate response using filtered data
        prompt = f"Create a mythical creature description based on GitHub profile of {github_handle} who primarily uses {', '.join(languages)} for programming. Make it creative and fantastic, about 2-3 sentences long."
        
        completion = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )
        
        return jsonify({
            'status': 'success',
            'response': completion.choices[0].message.content,
            'languages': list(languages),
            'github_url': f'https://github.com/{github_handle}',
            'num_repositories': len(repos)
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        })

@app.route('/chat/generate-image', methods=['POST'])
def generate_image():
    data = request.json
    prompt = data.get('prompt')
    
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        
        # Save the image URL
        image_url = response.data[0].url
        
        return jsonify({
            'status': 'success',
            'image_url': image_url
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
