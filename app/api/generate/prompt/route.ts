/* eslint-env node */
/* global process */
import { NextResponse } from "next/server";
import { getUserDetails, upsertImage } from "@/lib/db/astra";
import sharp from 'sharp';
import { Buffer } from 'buffer';
import { ACTION_FIGURE_PROMPT_TEMPLATE, ACTION_FIGURE_PROMPT_WITH_IMAGE_TEMPLATE, PROMPT_PREFIX } from './promptTemplates';
import { processAnimalSelection, cleanLanguagesString, cleanGithubUrl, buildActionFigurePrompt } from './promptUtils';
import { bufferToDataURI, analyzeImageWithOpenAI, generateImage } from './imageUtils';
import { PromptDetails } from './types';

// Add the GITHUB_USERNAME_REGEX (from code-beast-generator.tsx)
const GITHUB_USERNAME_REGEX = /^([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})$/;

// Define the allowed emotions (same as client-side)
const ALLOWED_EMOTIONS = [
  "Action Figure", "Zen/Godlike", "Ecstatic", "Angry", "Surprised", "Legendary",
  "Exploding Head", "Crying", "Zombie", "Ghibli Scene in rolling meadows", "Caped Crusader"
];

// Local fallback image that doesn't depend on external services
const FALLBACK_IMAGE_URL = "/images/codebeast-placeholder.png";

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
    
    if (imageProvided && imageAnalysisDescription && !imageAnalysisDescription.toLowerCase().includes('no person detected')) {
        // --- Build prompt using person features as style reference, not main subject --- 
        const features = imageAnalysisDescription; // Use the paragraph description
        if (emotion === "Action Figure") {
            // Use the new image-specific template
            finalPrompt = buildActionFigurePrompt(
                ACTION_FIGURE_PROMPT_WITH_IMAGE_TEMPLATE,
                normalizedUsername,
                promptDetails.basePrompt,
                promptDetails.animalSelection,
                promptDetails.cleanedLanguages,
                promptDetails.basePrompt,
                features // personFeatures
            );
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
                ACTION_FIGURE_PROMPT_TEMPLATE,
                normalizedUsername, 
                promptDetails.basePrompt, // Pass the original chimera description
                promptDetails.animalSelection, 
                promptDetails.cleanedLanguages,
                promptDetails.basePrompt,
                undefined // personFeatures
            );
        } else {
            finalPrompt = `A ${emotion} ${PROMPT_PREFIX}${promptDetails.basePrompt}`;
        }
    }

    console.log("API Route: Final prompt for EverArt Txt2Img:", finalPrompt);

    // --- Generate Image (Always Txt2Img now) --- 
    console.log("API Route: Attempting Txt2Img generation...");
    imageResult = await generateImage(finalPrompt, 'txt2img', {}, FALLBACK_IMAGE_URL);

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