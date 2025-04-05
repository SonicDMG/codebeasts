import { NextResponse } from "next/server";
import EverArt from 'everart';
import { getUserDetails } from "../../../lib/db/astra";

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
const PROMPT_PREFIX = "Create a retro-style creature in authentic low-resolution pixel art, reminiscent of classic SNES RPGs. The character should have large, sparkly eyes with pixel-perfect star reflections, chunky pixel shading, and deliberately limited color palette focusing on deep purples, teals, and warm golden tones. Add retro-style sparkles and light beams in the background using classic dithering patterns. The overall style should embrace the constraints of 16-bit era graphics with visible, chunky pixels and that nostalgic game aesthetic. ";

// Local fallback image that doesn't depend on external services
const FALLBACK_IMAGE_URL = "/images/codebeast-placeholder.png";

// Helper function to clean the language string
function cleanLanguagesString(rawLangString: string | undefined): string {
  if (!rawLangString) return '';
  // Remove prefix like "languages:", brackets [], and single quotes '
  return rawLangString.replace(/^languages:\s*\[|\]|'/g, '').trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("API Route: Received request body:", body);
    
    const { username } = body;

    if (!username) {
      console.error("Username is missing from request body");
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // First, check if we have existing user details
    const existingDetails = await getUserDetails(username);
    if (existingDetails) {
      console.log("API Route: Using existing user details from DB");
      
      // Clean languages from DB details
      const cleanedLanguages = cleanLanguagesString(existingDetails.languages);
      
      const dataToLog = {
        ...existingDetails,
        languages: cleanedLanguages, // Log cleaned version
        repoCount: existingDetails.repoCount ?? 30, // Use placeholder if not present
        animalSelection: existingDetails.animalSelection ?? [
          ["Python snake", "symbolizing adaptability and wisdom"],
          ["Spider", "reflecting the creativity and structure of HTML"],
          ["Owl", "representing the analytical mindset needed for TypeScript programming"]
        ] // Use placeholder if not present
      };
      console.log("API Route: Data before EverArt (DB Cache):", JSON.stringify(dataToLog, null, 2));

      // Generate new image using existing prompt
      try {
        const fullPrompt = PROMPT_PREFIX + existingDetails.prompt;
        console.log("Full prompt for existing user:", fullPrompt);
        
        const generations = await everart.v1.generations.create(
          '5000', // Model ID for FLUX1.1
          fullPrompt,
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
        console.log("EverArt generation result:", result);

        return NextResponse.json({ 
          languages: cleanedLanguages, // Send cleaned version
          prompt: existingDetails.prompt,
          githubUrl: existingDetails.githubUrl,
          repoCount: dataToLog.repoCount, // Include in response
          animalSelection: dataToLog.animalSelection, // Include in response
          imageUrl: result.image_url || FALLBACK_IMAGE_URL,
          status: {
            langflow: "cached",
            everart: result.image_url ? "success" : "error"
          }
        });
      } catch (everartError) {
        console.error("Error calling EverArt API:", everartError);
        return NextResponse.json({ 
          languages: cleanedLanguages, // Send cleaned version
          prompt: existingDetails.prompt,
          githubUrl: existingDetails.githubUrl,
          repoCount: dataToLog.repoCount, // Include in response
          animalSelection: dataToLog.animalSelection, // Include in response
          imageUrl: FALLBACK_IMAGE_URL,
          status: {
            langflow: "cached",
            everart: "error"
          }
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
          input: {
            text: username.toLowerCase() // Use normalized username
          }
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
      console.log("API Route: Full Langflow response:", JSON.stringify(langflowResponseData, null, 2));

      // Extract the message from the Langflow response structure
      let rawMessage;
      if (langflowResponseData?.outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message) {
        rawMessage = langflowResponseData.outputs[0].outputs[0].messages[0].message;
      }

      if (!rawMessage) {
        console.error("Could not find message in response. Full response:", langflowResponseData);
        return NextResponse.json(
          { error: "Could not extract message from response" },
          { status: 500 }
        );
      }

      // Parse the pipe-delimited fields
      const [rawLanguages, prompt, githubUrl] = rawMessage.split('|').map((field: string) => field.trim());

      // Clean languages from Langflow details
      const cleanedLanguages = cleanLanguagesString(rawLanguages);

      // --- Log new data --- 
      const newDataToLog = {
        languages: cleanedLanguages, // Log cleaned version
        prompt,
        githubUrl,
        repoCount: 30, // Hardcoded placeholder for now
        animalSelection: [
           ["Python snake", "symbolizing adaptability and wisdom"],
           ["Spider", "reflecting the creativity and structure of HTML"],
           ["Owl", "representing the analytical mindset needed for TypeScript programming"]
        ] // Hardcoded placeholder for now
      };
      console.log("API Route: Data before EverArt (Langflow):", JSON.stringify(newDataToLog, null, 2));
      // --- End Log ---

      // Generate image using EverArt SDK
      try {
        const fullPrompt = PROMPT_PREFIX + prompt;
        console.log("Full prompt for new user:", fullPrompt);
        
        const generations = await everart.v1.generations.create(
          '5000', // Model ID for FLUX1.1
          fullPrompt,
          'txt2img', // Generation type
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
        console.log("EverArt generation result:", result);

        // Return both the parsed Langflow data and the generated image URL
        return NextResponse.json({ 
          languages: cleanedLanguages, // Send cleaned version
          prompt,
          githubUrl,
          repoCount: newDataToLog.repoCount, // Include in response
          animalSelection: newDataToLog.animalSelection, // Include in response
          imageUrl: result.image_url || FALLBACK_IMAGE_URL,
          username: username.toLowerCase(),
          status: {
            langflow: "success",
            everart: result.image_url ? "success" : "error"
          }
        });
      } catch (everartError) {
        console.error("Error calling EverArt API:", everartError);
        // Continue with a placeholder image if EverArt fails
        return NextResponse.json({ 
          languages: cleanedLanguages, // Send cleaned version
          prompt,
          githubUrl,
          repoCount: newDataToLog.repoCount, // Include in response
          animalSelection: newDataToLog.animalSelection, // Include in response
          imageUrl: FALLBACK_IMAGE_URL,
          username: username.toLowerCase(),
          status: {
            langflow: "success",
            everart: "error"
          }
        });
      }
    } catch (langflowError) {
      console.error("Error calling Langflow API:", langflowError);
      return NextResponse.json(
        { 
          error: "Failed to communicate with Langflow API",
          username: username.toLowerCase(), // Return normalized username
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