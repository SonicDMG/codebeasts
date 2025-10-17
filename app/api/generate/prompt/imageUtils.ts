/* eslint-env node */
/* global process */
/**
 * imageUtils.ts
 *
 * Utility functions for image processing, analysis, and generation for Code Beasts.
 * Includes helpers for buffer conversion, OpenAI Vision analysis, and EverArt image generation.
 */

import { Buffer } from 'buffer';
import OpenAI from 'openai';
import EverArt from 'everart';

/**
 * Converts a Buffer to a Data URI string for use in image analysis APIs.
 * @param buffer - The image buffer
 * @param mimeType - The MIME type of the image
 * @returns The data URI string
 */
export function bufferToDataURI(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

// Initialize OpenAI client (if key is present)
const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

// Initialize EverArt client (lazy initialization)
let everart: EverArt | null = null;

function getEverArt(): EverArt {
  if (!everart) {
    const everartApiKey = process.env.EVERART_API_KEY;
    if (!everartApiKey) {
      throw new Error('EVERART_API_KEY environment variable is required');
    }
    everart = new EverArt(everartApiKey);
  }
  return everart;
}

/**
 * Analyzes an image using OpenAI Vision and returns a paragraph describing the primary person's features.
 * @param imageDataUri - The image as a data URI
 * @returns A paragraph description of the person, or null if not detected or OpenAI is not configured
 */
export async function analyzeImageWithOpenAI(imageDataUri: string): Promise<string | null> {
  if (!openai) return null;
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze the primary person in the image. Return a short, comma-separated list starting with the person's sex (male, female, or ambiguous), followed by the most visually dominant features. Always include skin tone and, if visually determinable, ethnicity or region of origin (e.g., South Asian, African, East Asian, Caucasian, etc.). Be accurate and do not confuse ethnicities (for example, do not describe a South Asian person as African American, and vice versa). Focus on sex, skin tone, ethnicity/region, hair color/style, eye color, and one or two unique features. Do not describe the background or overall scene. If no clear person is visible, state 'No person detected'. Example: 'female, medium brown skin, South Asian, black hair, brown eyes, glasses'."
          },
          {
            type: "image_url",
            image_url: { url: imageDataUri },
          },
        ],
      },
    ],
    max_tokens: 80,
  });
  let description = response.choices[0]?.message?.content;
  if (description && !description.toLowerCase().includes('no person detected')) {
    // Remove asterisks, trim whitespace, and limit to first 6 features
    description = description.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
    const features = description.split(',').map(f => f.trim()).filter(Boolean).slice(0, 6);
    return features.join(', ');
  }
  return null;
}

/**
 * Generates an image using the EverArt API.
 * @param prompt - The prompt string for image generation
 * @param type - The type of generation (e.g., 'txt2img')
 * @param options - Optional image generation options (height, width, imageCount)
 * @param fallbackImageUrl - URL to use if generation fails
 * @returns An object with the image URL and a success flag
 */
export async function generateImage(
  prompt: string,
  type: 'txt2img',
  options: { height?: number; width?: number; imageCount?: number } = {},
  fallbackImageUrl: string
): Promise<{ imageUrl: string; success: boolean }> {
  const baseParams: {
    imageCount?: number;
    height?: number;
    width?: number;
  } = {
    imageCount: options.imageCount ?? 1,
    height: options.height ?? 512,
    width: options.width ?? 512,
  };

  const everartClient = getEverArt();
  const generations = await everartClient.v1.generations.create(
    '5000',
    prompt,
    type,
    baseParams
  );

  if (!generations || generations.length === 0) {
    return { imageUrl: fallbackImageUrl, success: false };
  }

  const result = await everartClient.v1.generations.fetchWithPolling(generations[0].id);
  const finalImageUrl = result.image_url || fallbackImageUrl;
  return { imageUrl: finalImageUrl, success: !!result.image_url };
} 