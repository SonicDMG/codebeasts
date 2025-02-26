"""Module for handling Stability AI image generation and processing."""

import io
import logging
from typing import Optional
import requests
from PIL import Image
import logfire

# Configure logging with Logfire
logging.basicConfig(handlers=[logfire.LogfireLoggingHandler()])
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class StabilityGenerator:
    """A class to handle image generation using Stability AI's v2beta API."""

    def __init__(self, api_key: str):
        """Initialize the Stability API client.
        
        Args:
            api_key: Stability AI API key
        """
        self.api_key = api_key
        self.host = "https://api.stability.ai/v2beta/stable-image/generate/sd3"
        self.headers = {
            "authorization": f"Bearer {self.api_key}",
            "accept": "image/*",
            "content-type": "application/json"
        }
        logger.info("Initialized StabilityGenerator with API endpoint: %s", self.host)

    def generate_image(
        self,
        prompt: str,
        negative_prompt: str = "",
        aspect_ratio: str = "1:1",
        seed: int = 0,
        output_format: str = "png",
        model: str = "sd3-large-turbo",
        size: int = 512,
    ) -> Optional[Image.Image]:
        """Generate and pixelate an image based on the prompt.
        
        Args:
            prompt: Text description of the image
            negative_prompt: Things to avoid in the image
            aspect_ratio: Image aspect ratio
            seed: Random seed for generation
            output_format: Output image format
            size: Base size for the output
            pixel_size_factor: Factor for pixelation effect

        Returns:
            PIL.Image: Generated image
        """

        full_prompt = (
            f"{prompt}. A very cute animal in detailed pixel art style, "
            "with large expressive eyes looking directly at the viewer, "
            "a playful and adorable expression, "
            "vibrant colors, and a nostalgic retro 8-bit or 16-bit video game aesthetic. "
            "The image should have pixel shading, colorful lighting, and soft dithering "
            "for a polished effect."
        )
        logger.info("Processing prompt: %s", full_prompt)

        # Create multipart form data
        files = {
            'prompt': (None, full_prompt),
            'negative_prompt': (None, negative_prompt),
            'aspect_ratio': (None, aspect_ratio),
            'seed': (None, str(seed)),
            'output_format': (None, output_format),
            'size': (None, size),
            'model': (None, model)
        }

        headers = {
            "authorization": f"Bearer {self.api_key}",
            "accept": "image/*"
        }  # Remove content-type as requests will set it automatically for multipart

        try:
            logger.info("Sending request to Stability API...")
            response = requests.post(
                self.host,
                headers=headers,
                files=files,  # Use files instead of json
                timeout=45
            )

            logger.debug("Response status code: %s", response.status_code)
            logger.debug("Response headers: %s", dict(response.headers))

            if response.status_code != 200:
                logger.error("Error response: %s", response.text)

            response.raise_for_status()

            # Check for content filtering
            if response.headers.get("finish-reason") == "CONTENT_FILTERED":
                logger.warning("Content filtered by NSFW classifier")
                raise ValueError("NSFW content detected. Please try a different prompt.")

            logger.info("Successfully received image from API")
            img = Image.open(io.BytesIO(response.content))
            logger.debug("Image size: %s, mode: %s", img.size, img.mode)

            return img

        except requests.exceptions.RequestException as e:
            logger.error("API connection error: %s", str(e), exc_info=True)
            raise ConnectionError(f"Failed to connect to Stability API: {str(e)}") from e
        except Exception as e:
            logger.error("Unexpected error: %s", str(e), exc_info=True)
            raise RuntimeError(f"Error generating image: {str(e)}") from e
