
"""Module for handling Langflow API interactions."""

import logging
from typing import Dict, Any
import requests
from config import BASE_API_URL

logger = logging.getLogger(__name__)

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
    return parse_langflow_response(full_response)

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
