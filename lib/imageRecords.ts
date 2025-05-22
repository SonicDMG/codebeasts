/* eslint-env node */
/* global process */
import { ImageRecord } from "@/lib/db/astra";

/**
 * Fetches a user's image record (metadata, not the image file itself) from the CodeBeasts API.
 * This function is used for SSR and metadata generation.
 *
 * The actual image files are stored on Google Cloud Storage, but the metadata (including the image URL)
 * is stored in Astra DB and served by the /api/images/[username] API route.
 *
 * @param username - The GitHub username to fetch the image record for
 * @returns The user's image record or null if not found
 */
export async function fetchUserImageRecord(username: string): Promise<ImageRecord | null> {
  let response: Response | null = null;
  let fetchUrl = '';
  try {
    const baseUrl = getBaseUrl();
    fetchUrl = `${baseUrl}/api/images/${username}`;
    console.log(`fetchUserImageRecord: Fetching image for user: ${username}`);
    console.log(`fetchUserImageRecord: Attempting to fetch URL: ${fetchUrl}`);
    
    response = await fetch(fetchUrl, { cache: 'no-store' });
    console.log(`fetchUserImageRecord: Fetch response status: ${response.status}`);

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`fetchUserImageRecord: No image found (404) for user: ${username} at URL: ${fetchUrl}`);
        return null;
      }
      const errorText = await response.text().catch(() => 'Could not read error text');
      console.error(`fetchUserImageRecord: Failed fetch response. Status: ${response.status}, StatusText: ${response.statusText}, URL: ${fetchUrl}, Body: ${errorText}`);
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log(`fetchUserImageRecord: Successfully fetched and parsed image data for ${username}`);
    return data;
  } catch (error) {
    console.error(`fetchUserImageRecord: Error during fetch process for URL: ${fetchUrl}. Error:`, error instanceof Error ? error.message : String(error));
    if (response) {
       console.error(`fetchUserImageRecord: Error occurred after fetch. Response status was: ${response.status}`);
    }
    return null;
  }
}

/**
 * Returns the base URL for the app, used for SSR and API calls.
 */
export function getBaseUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const vercelUrl = process.env.VERCEL_URL;

  // Priority: Explicit APP_URL > Vercel URL > Localhost default
  let url: string;
  if (appUrl) {
    url = appUrl;
  } else if (vercelUrl) {
    // Vercel automatically handles https
    url = `https://${vercelUrl}`;
  } else {
    // Default to http for localhost if no other URL is provided
    url = 'http://localhost:3000';
  }

  // Keep console logs for debugging if needed, or remove for production
  console.log(`getBaseUrl: appUrl=${appUrl}, vercelUrl=${vercelUrl}, finalUrl=${url}`);
  return url;
} 