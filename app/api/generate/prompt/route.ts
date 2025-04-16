import { NextResponse } from "next/server";
import EverArt from 'everart';
import { getUserDetails, upsertImage } from "../../../lib/db/astra";
import sharp from 'sharp';
import { Buffer } from 'buffer';
import OpenAI from 'openai';

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
  animalSelection: string[] | undefined;
  source: 'cache' | 'langflow';
};

// Initialize OpenAI client
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.warn("OPENAI_API_KEY environment variable is missing. Image analysis will be skipped.");
}
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

// Initialize EverArt client
const everartApiKey = process.env.EVERART_API_KEY;
if (!everartApiKey) {
  throw new Error('EVERART_API_KEY environment variable is required');
}
const everart = new EverArt(everartApiKey);

// Style prefix for consistent image generation
const PROMPT_PREFIX = `Kawaii bizarre chimera hybrid creature, ultra low-resolution pixel 16-bit
pixel art style. Extremely pixelated NES/SNES aesthetic, chunky dithering patterns,
and high contrast. Strong directional lighting from the upper left, casting distinct
pixelated shadows on the right side. Rainbow gradient background. Subject facing the
camera, frontal view, medium shot, centered subject, shallow depth of field background.`;

// Local fallback image that doesn't depend on external services
const FALLBACK_IMAGE_URL = "/images/codebeast-placeholder.png";

// New prompt template for Action Figure
const ACTION_FIGURE_PROMPT_TEMPLATE = `
At the very top of the packaging, a bold red header band displays the text: '[Name] the [Title]' in large, clear, white letters.
Full product shot of a highly detailed action figure of a person, fully encased in a
clear plastic blister pack with a colorful cardboard backing. The main action figure
is a realistic human based on [character description], with lifelike features and natural
proportions. The action figure is shown in full body, including legs, standing upright
inside the blister pack. The packaging is the main focus, with a clear plastic bubble covering
the entire figure and all accessories. Inside the blister pack are compartments for
each coding language and its animal ([key items]), as well as coding-related
accessories such as a keyboard, laptop, or code book. Each item is in its own
separate compartment. The packaging is centered on a white background, with a red
header band reading '[Name] the [Title]' in bold white text, and an 'Ages [X]+' label.
Professional retail packaging with detailed labeling and product information. Sharp
focus on packaging details. No cropping of the blister pack.
`;

const ACTION_FIGURE_PROMPT_WITH_IMAGE_TEMPLATE = `
At the very top of the packaging, a bold red header band displays the text:
'[Name] the [Title]' in large, clear, white letters.
Full product shot of a highly detailed action figure, fully encased in a clear plastic
blister pack with a colorful cardboard backing. The packaging, accessories, and
compartments are the main focus. The action figure is shown in full body, including
legs, standing upright inside the blister pack. Inside the blister pack are
compartments for each coding language and its animal ([key items]), as well as
coding-related accessories such as a keyboard, laptop, or code book. Each item is in
its own separate compartment. The figure's facial features are subtly inspired by:
[person_features]. The packaging is centered on a white background, with an 'Ages [X]+'
label. Professional retail packaging with detailed labeling and product information.
Sharp focus on packaging details. No cropping of the blister pack.
`;

// Helper function to build the Action Figure prompt
function buildActionFigurePrompt(
  username: string,
  figureDescription: string,
  animalSelection: string[] | undefined, // Keep for now, might be useful later
  languages: string, // Keep languages for potential future use
  baseConceptPrompt: string // Add the base prompt from DB/Langflow
): string {
  const name = username.charAt(0).toUpperCase() + username.slice(1);

  // --- Set Title directly --- 
  const title = "Code Beast"; // Always use "Code Beast" as the title
  // --- Removed logic to extract from baseConceptPrompt --- 

  // --- Use animalSelection for key items if present --- 
  const keyItemsPrefixToRemove = "Create an illustration of a whimsical chimera featuring ";
  let cleanedKeyItems = baseConceptPrompt;
  if (cleanedKeyItems.toLowerCase().startsWith(keyItemsPrefixToRemove.toLowerCase())) {
      cleanedKeyItems = cleanedKeyItems.substring(keyItemsPrefixToRemove.length);
      console.log("buildActionFigurePrompt: Removed prefix from key items string.");
  }
  const keyItems = (animalSelection && animalSelection.length > 0)
    ? animalSelection.join(', ')
    : '';
  // --- End Accessory Generation ---

  const ages = "All";
  return ACTION_FIGURE_PROMPT_TEMPLATE
    .replace('[character description]', figureDescription)
    .replace('[Name]', name)
    .replace('[Title]', title) // Use the fixed "Code Beast" title
    .replace('[X]', ages)
    .replace('[key items]', keyItems); // Use animalSelection or cleaned base prompt here
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

// Helper function to process animalSelection from any source
function processAnimalSelection(rawSelection: any): string[] | undefined {
  if (Array.isArray(rawSelection)) {
    const flattened: any[] = rawSelection.flat();
    const filteredStrings: string[] = [];
    for (const item of flattened) {
      if (typeof item === 'string') {
        const trimmedItem = item.trim();
        if (trimmedItem !== '') {
          filteredStrings.push(trimmedItem);
        }
      } else if (typeof item === 'object' && item !== null) {
        const entries = Object.entries(item);
        for (const [key, value] of entries) {
          filteredStrings.push(`${key}: ${value}`);
        }
      }
    }
    if (filteredStrings.length > 0) {
      return filteredStrings;
    }
  } else if (typeof rawSelection === 'string') {
    const trimmedSelection = rawSelection.trim();
    if (trimmedSelection !== '') {
      return [trimmedSelection];
    }
  }
  return undefined;
}

// --- Refactored Data Fetching --- 
async function getUserPromptDetails(normalizedUsername: string): Promise<PromptDetails> {
  const existingDetails = await getUserDetails(normalizedUsername);

  if (existingDetails) {
    console.log("API Route: Using existing user details from DB for prompt base");
    // Log raw animalSelection data for debugging
    console.log("API Route: Raw existingDetails.animalSelection:", JSON.stringify(existingDetails.animalSelection));
    console.log("API Route: Type of existingDetails.animalSelection:", typeof existingDetails.animalSelection, Array.isArray(existingDetails.animalSelection));

    // Clean the prompt string from the DB
    let cleanedBasePrompt = existingDetails.prompt;
    if (cleanedBasePrompt && cleanedBasePrompt.toLowerCase().startsWith('prompt:')) {
        cleanedBasePrompt = cleanedBasePrompt.substring(7).trim();
        console.log("API Route: Removed 'prompt:' prefix from cached prompt.");
    }
    // --- Process animalSelection from DB --- 
    const animals = processAnimalSelection(existingDetails.animalSelection);
    console.log("API Route: Processed animal selection array:", animals);
    // --- End processing animalSelection ---

    return {
      basePrompt: cleanedBasePrompt, 
      cleanedLanguages: cleanLanguagesString(existingDetails.languages),
      cleanedGithubUrl: cleanGithubUrl(existingDetails.githubUrl, normalizedUsername),
      repoCount: existingDetails.repoCount,
      animalSelection: animals, // Pass the processed string[] | undefined
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
      body: JSON.stringify({
        input_value: normalizedUsername,
        output_type: "chat",
        input_type: "chat",
        session_id: normalizedUsername
      }) 
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

  const [rawLanguages, promptText, rawGithubUrl] = messageParts;

  // Extract num_repositories from messageParts
  const numReposPart = messageParts.find(part => part.startsWith('num_repositories:'));
  let count = undefined;
  if (numReposPart) {
    const value = numReposPart.replace('num_repositories:', '').trim();
    count = parseInt(value, 10);
  }

  // Extract animal_selection from messageParts
  const animalSelectionPart = messageParts.find(part => part.startsWith('animal_selection:'));
  let langflowAnimalSelection = undefined;
  if (animalSelectionPart) {
    let value = animalSelectionPart.replace('animal_selection:', '').trim();
    // Try to parse as JSON array (replace single quotes with double quotes)
    if (value.startsWith('[')) {
      try {
        langflowAnimalSelection = JSON.parse(value.replace(/'/g, '"'));
      } catch (e) {
        console.warn('Could not parse animal_selection from Langflow:', value);
      }
    }
  }
  const animals = processAnimalSelection(langflowAnimalSelection);
  console.log("Langflow: Processed animal selection array:", animals);

  return {
    basePrompt: promptText,
    cleanedLanguages: cleanLanguagesString(rawLanguages),
    cleanedGithubUrl: cleanGithubUrl(rawGithubUrl, normalizedUsername),
    repoCount: (typeof count === 'number' && !isNaN(count)) ? count : undefined,
    animalSelection: animals,
    source: 'langflow',
  };
}

// --- NEW: OpenAI Image Analysis Helper --- 
async function analyzeImageWithOpenAI(imageDataUri: string): Promise<string | null> {
    if (!openai) {
        console.log("OpenAI client not initialized. Skipping image analysis.");
        return null; // Skip if key is missing
    }
    console.log("API Route: Analyzing image with OpenAI GPT-4 Vision...");
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo", 
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Analyze the primary person in the image. Provide a concise paragraph describing only their key visual appearance features relevant for character creation. Focus on details like: Hair color/style, eye color, skin tone, dominant facial expression (e.g., smiling, neutral), glasses (if any), hat (if any), clothing colors/style, beard/mustache, and any other very prominent visual features. Do not describe the background or overall scene. If no clear person is visible, state 'No person detected'."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageDataUri,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 150, // Allow slightly more tokens for a paragraph
        });
        const description = response.choices[0]?.message?.content;
        console.log("API Route: OpenAI Vision analysis result (paragraph attempt):", description);
        // Basic check
        if (description && !description.toLowerCase().includes('no person detected')) {
             // Clean up potential markdown or extra spacing, just in case
             return description.replace(/[\*#]/g, '').replace(/\s+/g, ' ').trim(); 
        } 
        return null; // Return null if no person or empty response
    } catch (error) {
        console.error("API Route: Error calling OpenAI Vision API:", error);
        // Decide how to handle - return null or throw? Returning null allows fallback.
        return null; 
    }
}

// --- Refactored Image Generation (Remove strength) --- 
async function generateImage( 
  prompt: string, 
  type: 'txt2img', // <-- Revert to only txt2img
  // Remove img2img specific options
  options: { height?: number; width?: number; imageCount?: number } = {}
): Promise<{ imageUrl: string; success: boolean }> {
  try {
    console.log(`API Route: Calling EverArt create (${type})...`);
    
    // Simplify baseParams - no image or strength needed
    const baseParams: { 
        imageCount?: number; 
        height?: number; 
        width?: number; 
    } = {
        imageCount: options.imageCount ?? 1,
        height: options.height ?? 512,
        width: options.width ?? 512,
    };

    // Remove img2img conditional logic
    // if (type === 'img2img') { ... }

    // Log params being sent
    console.log("API Route: Sending params to EverArt:", 
        JSON.stringify({ 
            model_id: '5000', 
            prompt_length: prompt.length, 
            type, 
            imageCount: baseParams.imageCount, 
            height: baseParams.height, 
            width: baseParams.width 
            // Remove image_present and strength from log
        })
    );

    const generations = await everart.v1.generations.create(
      '5000', 
      prompt,
      type, // Will always be txt2img now from calling context
      baseParams
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
  let imageProvided = false; // Flag if image was part of the request

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
        imageProvided = true;
        console.log("API Route: Image file received:", file.name, file.type, file.size);
        originalImageMimeType = file.type;
        let imageBuffer = Buffer.from(new Uint8Array(await file.arrayBuffer()));
        try {
          const metadata = await sharp(imageBuffer).metadata();
          console.log("API Route: Original image dimensions:", metadata.width, 'x', metadata.height);
          // Resize if needed (e.g., > 1024 for Vision API)
          const MAX_DIM = 1024; 
          if (metadata.width && metadata.height && (metadata.width > MAX_DIM || metadata.height > MAX_DIM)) {
            console.log(`API Route: Resizing image to fit within ${MAX_DIM}x${MAX_DIM}...`);
            // Fix: Create a new Buffer from the resized buffer result
            const resizedBuffer = await sharp(imageBuffer).resize(MAX_DIM, MAX_DIM, { fit: 'inside', withoutEnlargement: true }).toBuffer();
            imageBuffer = Buffer.from(resizedBuffer); 
            // End Fix
            const resizedMetadata = await sharp(imageBuffer).metadata();
            console.log("API Route: Resized image dimensions:", resizedMetadata.width, 'x', resizedMetadata.height);
            originalImageMimeType = `image/${resizedMetadata.format || originalImageMimeType.split('/')[1]}`;
          }
        } catch (resizeError) {
          console.error("API Route: Error during image resizing:", resizeError);
        }
        processedImageDataUri = bufferToDataURI(imageBuffer, originalImageMimeType);
        console.log("API Route: Image processed for analysis. Data URI length:", processedImageDataUri?.length);
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

  // 3. Process Request (Analyze Image if provided, then Txt2Img)
  try {
    console.log("API Route: Starting generation processing...");
    let promptDetails: PromptDetails | null = null;
    let finalPrompt: string;
    let imageResult: { imageUrl: string; success: boolean };
    let imageAnalysisDescription: string | null = null;
    let promptSourceType: 'cache' | 'langflow' | 'image_analysis' = 'langflow';

    // --- Image Analysis Step (if image provided) ---
    if (imageProvided && processedImageDataUri) {
        console.log("API Route: Attempting image analysis...");
        imageAnalysisDescription = await analyzeImageWithOpenAI(processedImageDataUri);
        // Log analysis result but don't set promptSourceType here yet
        console.log("API Route: Image analysis completed (result:", imageAnalysisDescription ? "Success" : "Failed/Skipped", ")"); 
        if (!imageAnalysisDescription) {
             console.warn("API Route: Analysis failed/skipped, proceeding without feature injection in prompt.");
        }
    }
    
    // --- Get Base Prompt Details (Always needed) --- 
    console.log("API Route: Attempting to get user prompt details...");
    promptDetails = await getUserPromptDetails(normalizedUsername);
    console.log("API Route: Got user prompt details. Source:", promptDetails.source);
    promptSourceType = promptDetails.source; // Start with DB/Langflow source

    // --- Build Final Prompt & Determine Generation Type --- 
    // No longer determining type, always txt2img after potential analysis
    const baseCharacterPrompt = promptDetails.basePrompt;
    
    if (imageProvided && imageAnalysisDescription && !imageAnalysisDescription.toLowerCase().includes('no person detected')) {
        // --- Build prompt using person features as style reference, not main subject --- 
        const features = imageAnalysisDescription; // Use the paragraph description
        if (emotion === "Action Figure") {
            // Use the new image-specific template
            finalPrompt = ACTION_FIGURE_PROMPT_WITH_IMAGE_TEMPLATE
                .replace('[person_features]', features)
                .replace('[Name]', normalizedUsername.charAt(0).toUpperCase() + normalizedUsername.slice(1))
                .replace('[Title]', 'Code Beast')
                .replace('[X]', 'All')
                .replace('[key items]', promptDetails?.animalSelection && promptDetails.animalSelection.length > 0 ? promptDetails.animalSelection.join(', ') : '');
        } else {
            // Standard Emotion + Analysis: Combine concept + features
            const conceptDesc = promptDetails.basePrompt;
            const combinedDesc = `${conceptDesc}, with features resembling: ${features}`;
            finalPrompt = `A ${emotion} ${PROMPT_PREFIX}${combinedDesc}.`;
        }
        promptSourceType = 'image_analysis'; 
    } else {
        // --- Build prompt using ONLY DB/Langflow description (No image analysis) --- 
        console.log("API Route: Building prompt from DB/Langflow base prompt (no analysis used).");
        if (emotion === "Action Figure") {
            // Use the original base prompt (chimera description) directly
            finalPrompt = buildActionFigurePrompt(
                normalizedUsername, 
                promptDetails.basePrompt, // Pass the original chimera description
                promptDetails.animalSelection, 
                promptDetails.cleanedLanguages,
                promptDetails.basePrompt
            );
        } else {
            finalPrompt = `A ${emotion} ${PROMPT_PREFIX}${promptDetails.basePrompt}`;
        }
    }

    console.log("API Route: Final prompt for EverArt Txt2Img:", finalPrompt);

    // --- Generate Image (Always Txt2Img now) --- 
    console.log("API Route: Attempting Txt2Img generation...");
    imageResult = await generateImage(finalPrompt, 'txt2img');

    // --- Save Generation Result to DB --- 
    if (imageResult.success) {
        try {
            console.log(`API Route: Upserting image for ${normalizedUsername}`);
            await upsertImage({
                username: normalizedUsername,
                image_url: imageResult.imageUrl,
                created_at: new Date().toISOString()
            });
            console.log(`API Route: Upsert successful for ${normalizedUsername}`);
        } catch (dbError) {
            console.error(`API Route: Failed to upsert image for ${normalizedUsername}:`, dbError);
        }
    }

    // 4. Format and Return Response
    return NextResponse.json({
      languages: promptDetails.cleanedLanguages, 
      prompt: promptDetails.basePrompt, 
      imageAnalysis: imageAnalysisDescription, 
      githubUrl: promptDetails.cleanedGithubUrl,
      repoCount: promptDetails.repoCount,
      animalSelection: promptDetails.animalSelection,
      imageUrl: imageResult.imageUrl,
      username: normalizedUsername,
      isImg2Img: false, // Explicitly false now
      status: {
        promptSource: promptSourceType,
        everart: imageResult.success ? 'success' : 'error',
        analysis: imageAnalysisDescription ? 'success' : (imageProvided ? 'failed_or_skipped' : 'not_applicable')
      },
      source: promptSourceType 
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