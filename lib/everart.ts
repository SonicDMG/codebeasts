import type { GenerateImageResponse } from "@/types/api";

/**
 * Calls the EverArt API to generate an image.
 * @param prompt - The prompt for image generation
 * @param model - The model to use
 * @returns The image URL if successful
 * @throws Error if the API call fails
 */
export async function generateEverArtImage(prompt: string, model: string): Promise<GenerateImageResponse> {
  const apiKey = process.env.EVERART_API_KEY;
  if (!apiKey) {
    throw new Error("Missing EverArt API key");
  }
  const response = await fetch("https://api.everart.ai/v1/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
      model,
      image_count: 1,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`EverArt API error: ${response.status} ${response.statusText} ${errorText}`);
  }
  const data = await response.json();
  return { url: data.url };
} 