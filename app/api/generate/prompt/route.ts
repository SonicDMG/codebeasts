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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Received request body:", body);
    
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
      console.log("Using existing user details");
      
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
          languages: existingDetails.languages,
          prompt: existingDetails.prompt,
          githubUrl: existingDetails.githubUrl,
          imageUrl: result.image_url || FALLBACK_IMAGE_URL,
          status: {
            langflow: "cached",
            everart: result.image_url ? "success" : "error"
          }
        });
      } catch (everartError) {
        console.error("Error calling EverArt API:", everartError);
        return NextResponse.json({ 
          ...existingDetails,
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

      const data = await response.json();
      console.log("Full Langflow response:", JSON.stringify(data, null, 2));

      // Extract the message from the Langflow response structure
      let rawMessage;
      if (data?.outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message) {
        rawMessage = data.outputs[0].outputs[0].messages[0].message;
      }

      if (!rawMessage) {
        console.error("Could not find message in response. Full response:", data);
        return NextResponse.json(
          { error: "Could not extract message from response" },
          { status: 500 }
        );
      }

      // Parse the pipe-delimited fields
      const [languages, prompt, githubUrl] = rawMessage.split('|').map((field: string) => field.trim());

      console.log("Parsed fields:", { languages, prompt, githubUrl });

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
          languages,
          prompt,
          githubUrl,
          imageUrl: result.image_url || FALLBACK_IMAGE_URL,
          username: username.toLowerCase(), // Return normalized username
          status: {
            langflow: "success",
            everart: result.image_url ? "success" : "error"
          }
        });
      } catch (everartError) {
        console.error("Error calling EverArt API:", everartError);
        // Continue with a placeholder image if EverArt fails
        return NextResponse.json({ 
          languages,
          prompt,
          githubUrl,
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