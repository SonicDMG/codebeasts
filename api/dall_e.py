"""
DALL-E Image Generator Module

This module handles image generation using OpenAI's DALL-E API, specifically
for creating pixel art style animal mascots based on GitHub profile data.
"""

import io
import logging
from typing import Optional

import requests
from PIL import Image
import openai
import logfire

# Configure logging
logging.basicConfig(handlers=[logfire.LogfireLoggingHandler()])
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class DallEGenerator:
    """Handles image generation using OpenAI's DALL-E API.
    
    This class manages the connection to DALL-E and provides methods
    for generating pixel art style animal mascots.
    """

    def __init__(self, api_key: str):
        """Initialize the DALL-E client.
        
        Args:
            api_key: OpenAI API key for authentication
        """
        self.api_key = api_key
        openai.api_key = api_key
        logger.info("Initialized DALL-E Generator")

    def generate_image(self, prompt: str, size: str = "1024x1024") -> Optional[Image.Image]:
        """Generate a pixel art animal mascot based on the prompt.
        
        Args:
            prompt: Base description to influence the generated image
            size: Output image dimensions
            (must be "1024x1024", "1792x1024", or "1024x1792" for DALL-E 3)
            
        Returns:
            PIL.Image: Generated image
            
        Raises:
            ConnectionError: If DALL-E API request fails
            RuntimeError: For unexpected errors during generation
        """
        # Construct prompt with style guidelines
        negative_prompt = (
            "avoid any text in the image, "
            "avoid any objects that are not animals, "
            "avoid any animals in the background, "
            "do not draw color palettes or color swatches"
        )

        full_prompt = (
            "A very cute animal in detailed pixel art style, focus on the animal's face "
            "with large expressive eyes looking directly at the viewer, a playful and adorable expression, "
            "vibrant colors, and a nostalgic retro 8-bit or 16-bit video game aesthetic. "
            "The image should have pixel shading, colorful lighting, and soft dithering "
            f"for a polished effect, {prompt}, {negative_prompt}"
        )

        logger.info("Processing prompt: %s", full_prompt)

        try:
            logger.info("Sending request to DALL-E API with size: %s", size)
            response = openai.images.generate(
                model="dall-e-3",
                prompt=full_prompt,
                n=1,
                size=size
            )

            # Download generated image
            image_url = response.data[0].url
            logger.info("Successfully received image URL from API")
            logger.debug("Downloading image from URL: %s", image_url)

            img_response = requests.get(image_url, timeout=30)
            img_response.raise_for_status()

            return Image.open(io.BytesIO(img_response.content))

        except openai.OpenAIError as e:
            logger.error("DALL-E API error: %s", str(e), exc_info=True)
            raise ConnectionError(f"Failed to generate image with DALL-E: {str(e)}") from e

        except requests.exceptions.RequestException as e:
            logger.error("Image download error: %s", str(e), exc_info=True)
            raise ConnectionError(f"Failed to download generated image: {str(e)}") from e

        except Exception as e:
            logger.error("Unexpected error: %s", str(e), exc_info=True)
            raise RuntimeError(f"Error generating image: {str(e)}") from e
