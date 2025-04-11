import { NextResponse } from "next/server";
import EverArt from 'everart';
import { getUserDetails, upsertImage } from "../../../lib/db/astra";
import sharp from 'sharp';
import { Buffer } from 'buffer';

// Add the GITHUB_USERNAME_REGEX (from code-beast-generator.tsx)
const GITHUB_USERNAME_REGEX = /^([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})$/;

// Define the allowed emotions (same as client-side)
const ALLOWED_EMOTIONS = [
  "Action Figure", "Zen/Godlike", "Ecstatic", "Angry", "Surprised", "Legendary",
  "Exploding Head", "Crying", "Zombie", "Ghibli Scene in rolling meadows", "Caped Crusader"
];

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

type PromptDetails = {
  basePrompt: string;
  cleanedLanguages: string;
  cleanedGithubUrl: string;
  repoCount: number | undefined;
  animalSelection: string | undefined;
  source: 'cache' | 'langflow';
};

// Initialize EverArt client
const everartApiKey = process.env.EVERART_API_KEY;
if (!everartApiKey) {
  throw new Error('EVERART_API_KEY environment variable is required');
}
const everart = new EverArt(everartApiKey);

// Style prefix for consistent image generation
const PROMPT_PREFIX = "Kawaii bizarre chimera hybrid creature, ultra low-resolution pixel 16-bit pixel art style. " +
  "Extremely pixelated NES/SNES aesthetic, chunky dithering patterns, and high contrast. " +
  "Strong directional lighting from the upper left, casting distinct pixelated shadows on the right side. " +
  "Rainbow gradient background. Subject facing the camera, frontal view, medium shot, centered subject, shallow depth of field background.";

// Local fallback image that doesn't depend on external services
const FALLBACK_IMAGE_URL = "/images/codebeast-placeholder.png";

// New prompt template for Action Figure
const ACTION_FIGURE_PROMPT_TEMPLATE = "Full product shot displaying the entire, unobstructed detailed toy blister pack with [character description] action figure, facing forward. Centered on a white background. Red header band reads '[Name] the [Title]' in bold white text. Includes 'Ages [X]+' label, accessories in separate compartments ([key items]). Professional retail packaging with clear plastic bubble, detailed labeling, and product information. Sharp focus on packaging details. No cropping of the blister pack.";

// Helper function to build the Action Figure prompt
function buildActionFigurePrompt(
  username: string,
  basePrompt: string,
  animalSelection: string | undefined,
  languages: string
): string {
  const name = username.charAt(0).toUpperCase() + username.slice(1); // Capitalize username
  const title = animalSelection || "Code Beast"; // Use animal selection or fallback
  const characterDescription = basePrompt; // Use the generated creature prompt
  // Extract first 2-3 languages as accessories
  const languageList = languages.split(',').map(l => l.trim()).filter(l => l);
  const keyItems = languageList.slice(0, 3).join(', ') || 'Code Snippets'; // Use languages or fallback
  const ages = "All"; // Static value as requested

  return ACTION_FIGURE_PROMPT_TEMPLATE
    .replace('[character description]', characterDescription)
    .replace('[Name]', name)
    .replace('[Title]', title)
    .replace('[X]', ages)
    .replace('[key items]', keyItems);
}

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

// Adjust helper to take Buffer
function bufferToDataURI(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

// --- Refactored Data Fetching --- 
async function getUserPromptDetails(normalizedUsername: string): Promise<PromptDetails> {
  const existingDetails = await getUserDetails(normalizedUsername);

  if (existingDetails) {
    console.log("API Route: Using existing user details from DB for prompt base");
    return {
      basePrompt: existingDetails.prompt,
      cleanedLanguages: cleanLanguagesString(existingDetails.languages),
      cleanedGithubUrl: cleanGithubUrl(existingDetails.githubUrl, normalizedUsername),
      repoCount: existingDetails.repoCount,
      animalSelection: typeof existingDetails.animalSelection === 'string' ? existingDetails.animalSelection : undefined,
      source: 'cache',
    };
  }

  console.log("API Route: Calling Langflow for prompt base");
  if (!process.env.LANGFLOW_BASE_URL || !process.env.LANGFLOW_FLOW_ID) {
      console.error("Missing Langflow environment variables");
      throw new Error("Server configuration error for Langflow");
  }
  const langflowUrl = `${process.env.LANGFLOW_BASE_URL}/api/v1/run/${process.env.LANGFLOW_FLOW_ID}`;
  const langflowResponse = await fetch(langflowUrl, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ session_id: normalizedUsername }) 
  });

  if (!langflowResponse.ok) {
      const errorText = await langflowResponse.text();
      console.error("Langflow API error:", { status: langflowResponse.status, error: errorText });
      throw new Error(`Langflow call failed: ${langflowResponse.statusText}`);
  }

  const langflowResponseData = await langflowResponse.json();
  const rawMessage = langflowResponseData?.outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message;
  if (!rawMessage || typeof rawMessage !== 'string') {
      console.error("Could not extract message from Langflow response:", langflowResponseData);
      throw new Error("Could not parse Langflow response");
  }

  const messageParts = rawMessage.split('|').map((field: string) => field.trim());
  if (messageParts.length < 4) {
      console.error("Unexpected message format from Langflow:", rawMessage);
      throw new Error("Unexpected format from Langflow");
  }

  const [rawLanguages, promptText, rawGithubUrl, rawRepoCount] = messageParts;
  const count = parseInt(rawRepoCount, 10);

  return {
    basePrompt: promptText,
    cleanedLanguages: cleanLanguagesString(rawLanguages),
    cleanedGithubUrl: cleanGithubUrl(rawGithubUrl, normalizedUsername),
    repoCount: !isNaN(count) ? count : undefined,
    animalSelection: undefined, // Langflow doesn't provide this
    source: 'langflow',
  };
}

// --- Refactored Image Generation --- 

async function generateImage( 
  prompt: string, 
  type: 'txt2img' | 'img2img', 
  options: { image?: string; height?: number; width?: number; imageCount?: number } = {}
): Promise<{ imageUrl: string; success: boolean }> {
  try {
    console.log(`API Route: Calling EverArt create (${type})...`);
    
    // Explicitly define base params and add image only if needed
    const baseParams: { imageCount?: number; height?: number; width?: number; image?: string } = {
        imageCount: options.imageCount ?? 1,
        height: options.height ?? 512,
        width: options.width ?? 512,
    };

    if (type === 'img2img') {
        if (!options.image) {
            throw new Error("Image data URI is required for img2img type.");
        }
        baseParams.image = options.image;
    }

    // Log params being sent (excluding potentially large image data)
    console.log("API Route: Sending params to EverArt:", 
        JSON.stringify({ 
            model_id: '5000', 
            prompt_length: prompt.length, 
            type, 
            imageCount: baseParams.imageCount, 
            height: baseParams.height, 
            width: baseParams.width, 
            image_present: !!baseParams.image 
        })
    );

    const generations = await everart.v1.generations.create(
      '5000', // Model ID
      prompt,
      type,
      baseParams // Pass the explicitly constructed params object
    ) as Generation[];

    if (!generations || generations.length === 0) {
      throw new Error(`No generations returned from EverArt (${type})`);
    }

    const result = await everart.v1.generations.fetchWithPolling(generations[0].id) as Generation;
    console.log(`EverArt generation result (${type} path):`, result);
    const finalImageUrl = result.image_url || FALLBACK_IMAGE_URL;
    
    return { imageUrl: finalImageUrl, success: !!result.image_url };

  } catch (error) {
    console.error(`Error calling EverArt API (${type}):`, error);
    return { imageUrl: FALLBACK_IMAGE_URL, success: false };
  }
}

export async function POST(request: Request) {
  console.log("API Route: POST function entered.");
  let username: string | undefined;
  let emotion: string | undefined;
  let processedImageDataUri: string | undefined;
  let originalImageMimeType: string | undefined;
  let isImg2ImgRequest = false;

  // 1. Parse Request
  try {
    const contentType = request.headers.get('content-type');
    console.log("API Route: Content-Type:", contentType);

    if (contentType?.includes('multipart/form-data')) {
      console.log("API Route: Processing FormData...");
      const formData = await request.formData();
      username = formData.get('username') as string | undefined;
      emotion = formData.get('emotion') as string | undefined;
      const file = formData.get('imageFile');

      if (file instanceof File && file.size > 0) {
        console.log("API Route: Image file received:", file.name, file.type, file.size);
        originalImageMimeType = file.type; // Store original mime type
        // Convert ArrayBuffer to Uint8Array before passing to Buffer.from()
        const arrayBuffer = await file.arrayBuffer();
        // Explicitly type imageBuffer as Buffer
        let imageBuffer: Buffer = Buffer.from(new Uint8Array(arrayBuffer)); 

        // --- Image Resizing Logic --- 
        try {
          const metadata = await sharp(imageBuffer).metadata();
          console.log("API Route: Original image dimensions:", metadata.width, 'x', metadata.height);

          if (metadata.width && metadata.height && (metadata.width > 512 || metadata.height > 512)) {
            console.log("API Route: Resizing image to fit within 512x512...");
            imageBuffer = await sharp(imageBuffer)
              .resize(512, 512, {
                fit: 'inside', // Maintain aspect ratio within bounds
                withoutEnlargement: true // Don't upscale smaller images
              })
              .toBuffer();
            const resizedMetadata = await sharp(imageBuffer).metadata(); // Get new dimensions
            console.log("API Route: Resized image dimensions:", resizedMetadata.width, 'x', resizedMetadata.height);
            // Mime type might change after processing (e.g., if input was webp, sharp might default to jpeg/png)
            // It's safer to use the format from sharp metadata if available, otherwise stick to original.
            originalImageMimeType = `image/${resizedMetadata.format || originalImageMimeType.split('/')[1]}`;
          } else {
            console.log("API Route: Image dimensions are within limits, no resizing needed.");
          }
        } catch (resizeError) {
            console.error("API Route: Error during image resizing:", resizeError);
            // Decide how to handle: proceed with original, or throw error?
            // Let's proceed with original for now, but log the error.
        }
        // --- End Resizing Logic --- 

        processedImageDataUri = bufferToDataURI(imageBuffer, originalImageMimeType);
        isImg2ImgRequest = true;
        console.log("API Route: Image processed. Data URI length:", processedImageDataUri?.length);

      } else {
        console.log("API Route: No valid image file found in FormData.");
      }
    } else if (contentType?.includes('application/json')) {
      console.log("API Route: Processing JSON...");
      const body = await request.json();
      username = body.username;
      emotion = body.emotion;
    } else {
      console.warn("API Route: Unsupported Content-Type:", contentType);
      return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 415 });
    }
  } catch (error) {
      console.error("Error parsing request:", error);
      return NextResponse.json({ error: "Failed to parse request" }, { status: 400 });
  }

  // 2. Validate Inputs
  if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username.trim())) {
    console.error("Invalid or missing username:", username);
    return NextResponse.json({ error: "Valid GitHub username is required" }, { status: 400 });
  }
  if (!emotion || typeof emotion !== 'string' || !ALLOWED_EMOTIONS.includes(emotion)) {
    console.error("Invalid or missing emotion:", emotion);
    return NextResponse.json({ error: `Invalid emotion selected. Must be one of: ${ALLOWED_EMOTIONS.join(', ')}` }, { status: 400 });
  }
  const normalizedUsername = username.trim().toLowerCase();

  // 3. Process Request (Img2Img or Txt2Img)
  try {
    let promptDetails: PromptDetails;
    let finalPrompt: string;
    let imageResult: { imageUrl: string; success: boolean };

    // Get prompt details (needed for both paths to build the final prompt)
    promptDetails = await getUserPromptDetails(normalizedUsername);

    // Build the final prompt (based on emotion)
    if (emotion === "Action Figure") {
        finalPrompt = buildActionFigurePrompt(normalizedUsername, promptDetails.basePrompt, promptDetails.animalSelection, promptDetails.cleanedLanguages);
    } else {
        finalPrompt = `A ${emotion} ${PROMPT_PREFIX}${promptDetails.basePrompt}`;
    }
    
    // Add specific instruction for img2img feature transfer
    if (isImg2ImgRequest) {
        // Revised instruction focusing on personal features and ignoring structure
        finalPrompt += " Transfer specific personal appearance features (like hair color, eye color, skin tone, freckles, clothing color/style, glasses, hats) from the person in the input image onto the generated creature. Maintain the creature's form and pose based on the initial prompt description, not the input image's structure.";
    }

    console.log("API Route: Final prompt for EverArt:", finalPrompt);

    if (isImg2ImgRequest && processedImageDataUri) {
      // --- Img2Img Path --- 
      console.log("API Route: Entering Img2Img Generation Path with processed image");
      imageResult = await generateImage(finalPrompt, 'img2img', { image: processedImageDataUri });

      // --- Save successful img2img results to DB --- 
      if (imageResult.success) {
          try {
              console.log(`API Route: Upserting image for ${normalizedUsername} (img2img)`);
              await upsertImage({
                  username: normalizedUsername,
                  image_url: imageResult.imageUrl,
                  created_at: new Date().toISOString()
              });
              console.log(`API Route: Upsert successful for ${normalizedUsername} (img2img)`);
          } catch (dbError) {
              console.error(`API Route: Failed to upsert image for ${normalizedUsername} (img2img):`, dbError);
              // Log error but continue, as the image was generated successfully
          }
      }
      // --- End DB Save --- 

    } else {
      // --- Txt2Img Path --- 
      console.log("API Route: Entering Txt2Img Generation Path");
      imageResult = await generateImage(finalPrompt, 'txt2img');
      
      // Attempt DB upsert only for successful txt2img
      if (imageResult.success) {
          try {
              console.log(`API Route: Upserting image for ${normalizedUsername} (txt2img)`);
              await upsertImage({
                  username: normalizedUsername,
                  image_url: imageResult.imageUrl,
                  created_at: new Date().toISOString()
              });
              console.log(`API Route: Upsert successful for ${normalizedUsername}`);
          } catch (dbError) {
              console.error(`API Route: Failed to upsert image for ${normalizedUsername}:`, dbError);
              // Log error but continue
          }
      }
    }

    // 4. Format and Return Response
    return NextResponse.json({
      // Core details from prompt fetching
      languages: promptDetails.cleanedLanguages,
      prompt: promptDetails.basePrompt,
      githubUrl: promptDetails.cleanedGithubUrl,
      repoCount: promptDetails.repoCount,
      animalSelection: promptDetails.animalSelection,
      // Image result
      imageUrl: imageResult.imageUrl,
      // Metadata
      username: normalizedUsername,
      isImg2Img: isImg2ImgRequest,
      status: {
        promptSource: promptDetails.source,
        everart: imageResult.success ? 'success' : 'error'
      },
      source: promptDetails.source // Keep 'source' consistent with original 'langflow'/'cache' meaning
    });

  } catch (error) {
    // Catch errors from getUserPromptDetails or unexpected issues
    console.error("Error processing generation request:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate image";
    return NextResponse.json(
      { 
        error: errorMessage,
        username: normalizedUsername,
        status: { general: "error" }
      },
      { status: 500 }
    );
  }
} 