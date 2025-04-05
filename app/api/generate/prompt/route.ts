import { NextResponse } from "next/server";
import EverArt from 'everart';
import { getUserDetails, upsertImage } from "../../../lib/db/astra";

// Define types from the EverArt SDK
type Generation = {
  id: string;
  model_id: string;
  status: 'STARTING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
  image_url: string | null;
  type: 'txt2img' | 'img2img';
  createdAt: Date;
  updatedAt: Date;
};

// Initialize EverArt client
const everartApiKey = process.env.EVERART_API_KEY;
if (!everartApiKey) {
  throw new Error('EVERART_API_KEY environment variable is required');
}
const everart = new EverArt(everartApiKey);

// Style prefix for consistent image generation
// const PROMPT_PREFIX = "Create a cute, retro-style creature in authentic low-resolution pixel art, " +
// "reminiscent of classic SNES RPGs. The character should have large, sparkly eyes, chunky pixel shading, " +
// "and deliberately limited color palette. The overall style should embrace the constraints of 16-bit era graphics with visible, " +
// "chunky pixels and that nostalgic game aesthetic.";

const PROMPT_PREFIX = "Kawaii adorable chimera creature, ultra low-resolution pixel 16-bit pixel art style. " +
  "Extremely pixelated NES/SNES aesthetic, chunky dithering patterns, and high contrast. " +
  "Rainbow gradient background.";

// Local fallback image that doesn't depend on external services
const FALLBACK_IMAGE_URL = "/images/codebeast-placeholder.png";

// Helper function to clean the language string
function cleanLanguagesString(rawLangString: string | undefined): string {
  if (!rawLangString) return '';
  // Remove prefix like "languages:", brackets [], and single quotes '
  return rawLangString.replace(/^languages:\s*\[|\]|'/g, '').trim();
}

// Helper function to clean the GitHub URL
function cleanGithubUrl(rawUrl: string | undefined, username: string): string {
  const fallbackUrl = `https://github.com/${username.toLowerCase()}`;
  if (!rawUrl) {
    console.warn(`cleanGithubUrl: Raw URL missing. Returning fallback: ${fallbackUrl}`);
    return fallbackUrl;
  } 
  
  const githubPrefix = 'https://github.com/';
  const index = rawUrl.indexOf(githubPrefix);
  
  if (index !== -1) {
    const extractedUrl = rawUrl.substring(index);
    console.log(`cleanGithubUrl: Extracted "${extractedUrl}" from "${rawUrl}"`);
    return extractedUrl;
  } 
  
  console.warn(`cleanGithubUrl: Unexpected format for rawUrl: "${rawUrl}". Returning fallback: ${fallbackUrl}`);
  return fallbackUrl;
}

export async function POST(request: Request) {
  console.log("API Route: POST function entered."); // ADD VERY EARLY LOG
  try {
    const body = await request.json();
    console.log("API Route: Received request body:", body);
    
    const { username, emotion } = body;
    const normalizedUsername = username.toLowerCase(); // Ensure we use normalized consistently

    if (!username) {
      console.error("Username is missing from request body");
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Add basic validation for emotion
    if (!emotion) {
        console.error("Emotion is missing from request body");
        return NextResponse.json(
            { error: "Emotion is required" },
            { status: 400 }
        );
    }

    // First, check if we have existing user details
    const existingDetails = await getUserDetails(username);
    if (existingDetails) {
      console.log("API Route: Using existing user details from DB");
      console.log("API Route: repoCount from DB:", existingDetails.repoCount); // ADD Log
      
      // Clean languages from DB details
      const cleanedLanguages = cleanLanguagesString(existingDetails.languages);
      const cleanedGithubUrl = cleanGithubUrl(existingDetails.githubUrl, username);
      
      const dataToLog = {
        ...existingDetails,
        languages: cleanedLanguages,
        githubUrl: cleanedGithubUrl,
        repoCount: existingDetails.repoCount,
        animalSelection: existingDetails.animalSelection // Pass actual value (could be undefined)
      };
      console.log("API Route: Data before EverArt (DB Cache):", JSON.stringify(dataToLog, null, 2));

      // Generate new image using existing prompt AND new emotion
      try {
        // Prepend emotion to the full prompt
        const fullPrompt = `A ${emotion} ${PROMPT_PREFIX}${existingDetails.prompt}`;
        console.log("Full prompt for existing user (with emotion):", fullPrompt);
        
        const generations = await everart.v1.generations.create(
          '5000', // Model ID for FLUX1.1
          fullPrompt, // Use modified prompt
          'txt2img',
          { 
            imageCount: 1,
            height: 512,
            width: 512
          }
        ) as Generation[];

        if (!generations || generations.length === 0) {
          throw new Error('No generations returned from EverArt');
        }

        const result = await everart.v1.generations.fetchWithPolling(generations[0].id) as Generation;
        console.log("EverArt generation result (cached path):", result);

        const finalImageUrl = result.image_url || FALLBACK_IMAGE_URL;

        // --- Save/Update the image record in the DB --- 
        if (result.image_url) { // Only save if EverArt succeeded
          try {
            console.log(`API Route: Upserting image for ${normalizedUsername} (cached path)`);
            await upsertImage({
              username: normalizedUsername, 
              image_url: finalImageUrl,
              created_at: new Date().toISOString()
            });
            console.log(`API Route: Upsert successful for ${normalizedUsername}`);
          } catch (dbError) {
            console.error(`API Route: Failed to upsert image for ${normalizedUsername} (cached path):`, dbError);
            // Decide if failure to save should prevent returning success to user?
            // For now, we'll still return the image URL but log the error.
          }
        }
        // --- End Save/Update ---

        return NextResponse.json({ 
          languages: cleanedLanguages,
          prompt: existingDetails.prompt,
          githubUrl: cleanedGithubUrl,
          repoCount: dataToLog.repoCount,
          animalSelection: dataToLog.animalSelection, // Send actual value (could be undefined)
          imageUrl: finalImageUrl,
          status: {
            langflow: "cached",
            everart: result.image_url ? "success" : "error"
          },
          source: 'cache'
        });
      } catch (everartError) {
        console.error("Error calling EverArt API:", everartError);
        return NextResponse.json({ 
          languages: cleanedLanguages,
          prompt: existingDetails.prompt,
          githubUrl: cleanedGithubUrl,
          repoCount: dataToLog.repoCount,
          animalSelection: dataToLog.animalSelection, // Send actual value (could be undefined)
          imageUrl: FALLBACK_IMAGE_URL,
          status: {
            langflow: "cached",
            everart: "error"
          },
          source: 'cache'
        });
      }
    }

    // Check if environment variables are set
    if (!process.env.LANGFLOW_BASE_URL || !process.env.LANGFLOW_FLOW_ID || !process.env.EVERART_API_KEY) {
      console.error("Missing required environment variables:", {
        LANGFLOW_BASE_URL: !!process.env.LANGFLOW_BASE_URL,
        LANGFLOW_FLOW_ID: !!process.env.LANGFLOW_FLOW_ID,
        EVERART_API_KEY: !!process.env.EVERART_API_KEY
      });
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Call Langflow API directly
    const langflowUrl = `${process.env.LANGFLOW_BASE_URL}/api/v1/run/${process.env.LANGFLOW_FLOW_ID}`;
    console.log("Calling Langflow at:", langflowUrl);
    
    try {
      // First, return initial data without image
      const response = await fetch(langflowUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: normalizedUsername
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Langflow API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: langflowUrl
        });
        return NextResponse.json(
          { error: `Failed to generate prompt: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      const langflowResponseData = await response.json();
      // --- ADD LOGS --- 
      console.log("API Route (Langflow Path): Full Langflow response data:", JSON.stringify(langflowResponseData, null, 2));
      // --- END LOGS --- 

      // Extract the message from the Langflow response structure
      let rawMessage;
      if (langflowResponseData?.outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message) {
        rawMessage = langflowResponseData.outputs[0].outputs[0].messages[0].message;
      }
      // --- ADD LOGS --- 
      console.log(`API Route (Langflow Path): Extracted rawMessage: [${rawMessage}]`);
      // --- END LOGS --- 

      if (!rawMessage) {
        console.error("Could not find message in response. Full response:", langflowResponseData);
        return NextResponse.json(
          { error: "Could not extract message from response" },
          { status: 500 }
        );
      }

      // Parse the pipe-delimited fields - ADD repoCount
      console.log("API Route: Raw message from Langflow:", rawMessage); // ADD Log
      const messageParts = rawMessage.split('|').map((field: string) => field.trim()); // Store parts
      console.log("API Route: Split message parts:", messageParts); // ADD Log
      const [rawLanguages, prompt, rawGithubUrl, rawRepoCount] = messageParts; // Assign from parts
      console.log("API Route: Raw repo count string:", rawRepoCount); // ADD Log
      
      // Improved parsing: Handle NaN explicitly
      const count = parseInt(rawRepoCount, 10);
      const repoCount = !isNaN(count) ? count : undefined; 
      console.log("API Route: Parsed repo count value:", repoCount); // ADD Log

      // Clean languages from Langflow details
      const cleanedLanguages = cleanLanguagesString(rawLanguages);
      const cleanedGithubUrl = cleanGithubUrl(rawGithubUrl, username);

      // --- Log new data --- 
      const newDataToLog = {
        languages: cleanedLanguages,
        prompt,
        githubUrl: cleanedGithubUrl,
        repoCount: repoCount,
        animalSelection: undefined // Explicitly undefined as Langflow doesn't provide it
      };
      console.log("API Route: Data before EverArt (Langflow):", JSON.stringify(newDataToLog, null, 2));
      // --- End Log ---

      // Generate image using EverArt SDK, including emotion
      try {
        // Prepend emotion to the full prompt
        const fullPrompt = `A ${emotion} ${PROMPT_PREFIX}${newDataToLog.prompt}`;
        console.log("Full prompt for new user (with emotion):", fullPrompt);

        const generations = await everart.v1.generations.create(
          '5000',
          fullPrompt, // Use modified prompt
          'txt2img',
          { 
            imageCount: 1,
            height: 512,
            width: 512
          }
        ) as Generation[];

        if (!generations || generations.length === 0) {
          throw new Error('No generations returned from EverArt');
        }

        // Wait for the first generation to complete
        const result = await everart.v1.generations.fetchWithPolling(generations[0].id) as Generation;
        console.log("EverArt generation result (new path):", result);

        const finalImageUrl = result.image_url || FALLBACK_IMAGE_URL;

        // --- Save/Update the image record in the DB --- 
        if (result.image_url) { // Only save if EverArt succeeded
           try {
            console.log(`API Route: Upserting image for ${normalizedUsername} (new path)`);
            await upsertImage({
              username: normalizedUsername,
              image_url: finalImageUrl,
              created_at: new Date().toISOString()
            });
            console.log(`API Route: Upsert successful for ${normalizedUsername}`);
          } catch (dbError) {
            console.error(`API Route: Failed to upsert image for ${normalizedUsername} (new path):`, dbError);
            // Log error but continue
          }
        }
        // --- End Save/Update ---

        return NextResponse.json({ 
          languages: newDataToLog.languages,
          prompt: newDataToLog.prompt,
          githubUrl: newDataToLog.githubUrl,
          repoCount: newDataToLog.repoCount,
          animalSelection: newDataToLog.animalSelection,
          imageUrl: finalImageUrl,
          username: normalizedUsername, // Ensure normalized username is returned
          status: {
            langflow: "success",
            everart: result.image_url ? "success" : "error"
          },
          source: 'langflow'
        });
      } catch (everartError) {
        console.error("Error calling EverArt API:", everartError);
        // Continue with a placeholder image if EverArt fails
        return NextResponse.json({ 
          languages: newDataToLog.languages,
          prompt: newDataToLog.prompt,
          githubUrl: newDataToLog.githubUrl,
          repoCount: newDataToLog.repoCount,
          animalSelection: newDataToLog.animalSelection,
          imageUrl: FALLBACK_IMAGE_URL,
          username: normalizedUsername,
          status: {
            langflow: "success",
            everart: "error"
          },
          source: 'langflow'
        });
      }
    } catch (langflowError) {
      console.error("Error calling Langflow API:", langflowError);
      return NextResponse.json(
        { 
          error: "Failed to communicate with Langflow API",
          username: normalizedUsername, // Return normalized username
          status: {
            langflow: "error",
            everart: "not_started"
          }
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate prompt",
        status: {
          langflow: "error",
          everart: "not_started"
        }
      },
      { status: 500 }
    );
  }
} 