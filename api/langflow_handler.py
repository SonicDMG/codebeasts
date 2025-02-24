
"""Module for handling Langflow API interactions."""

import logging
import requests
from typing import Dict, Any
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

    try:
        response = requests.post(api_url, json=payload, headers=headers, timeout=120)
        response.raise_for_status()
        response_data = response.json()
        full_response = response_data['outputs'][0]['outputs'][0]['results']['message']['text']
        return parse_langflow_response(full_response)
    except requests.exceptions.RequestException as e:
        logger.error("Error calling Langflow API: %s", str(e), exc_info=True)
        raise

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
        if len(parts) > 0:
            languages_part = parts[0].split(':', 1)
            if len(languages_part) > 1:
                data['languages'] = [
                    lang.strip().strip("'\"")
                    for lang in languages_part[1].strip('[]').split(',')
                    if lang.strip()
                ]

        # Parse other fields
        if len(parts) > 1:
            prompt_part = parts[1].split(':', 1)
            if len(prompt_part) > 1:
                data['prompt'] = prompt_part[1].strip()

        if len(parts) > 2:
            url_part = parts[2].split(':', 1)
            if len(url_part) > 1:
                data['github_user_name_url'] = url_part[1].strip()

        if len(parts) > 3:
            repos_part = parts[3].split(':', 1)
            if len(repos_part) > 1:
                try:
                    data['num_repositories'] = int(repos_part[1].strip())
                except ValueError:
                    pass

        # Parse animal selection if it exists
        if len(parts) > 4:
            animals_part = parts[4].split(':', 1)
            if len(animals_part) > 1:
                animals_str = animals_part[1].strip().strip('[]')
                if animals_str:
                    try:
                        animal_entries = eval(animals_str)
                        if isinstance(animal_entries, list):
                            data['animal_selection'] = [
                                (entry[0], entry[1]) 
                                for entry in animal_entries 
                                if isinstance(entry, (list, tuple)) and len(entry) == 2
                            ]
                    except (SyntaxError, ValueError, TypeError):
                        logger.warning("Failed to parse animal selection", exc_info=True)

    except Exception as e:
        logger.error("Error parsing Langflow response: %s", str(e), exc_info=True)

    return data
