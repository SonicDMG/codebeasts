/* eslint-env node */
/* global process */
import { NextResponse } from "next/server";
import { getUserDetails, upsertImage } from "@/lib/db/astra";
import sharp from 'sharp';
import { Buffer } from 'buffer';
import { ACTION_FIGURE_PROMPT_TEMPLATE, ACTION_FIGURE_PROMPT_WITH_IMAGE_TEMPLATE, PROMPT_PREFIX } from './promptTemplates';
import { processAnimalSelection, cleanLanguagesString, cleanGithubUrl, buildActionFigurePrompt } from './promptUtils';
import { bufferToDataURI, analyzeImageWithOpenAI, generateImage } from './imageUtils';
import type { PromptDetails } from "@/types/prompt";
import type { GeneratePromptResponse, GeneratePromptErrorResponse } from "@/types/api";
import { fetchLangflowPrompt } from "@/lib/langflow";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { validateUploadedFile, sanitizeImage, logFileUpload } from "@/lib/fileValidation";
import { securityLog, debugLog } from "@/lib/logger";
import { safeValidate, generatePromptSchema, validateAndSanitizeUsername } from "@/lib/validation";

// Local fallback image that doesn't depend on external services
const FALLBACK_IMAGE_URL = "/images/codebeast-placeholder.png";

// --- Refactored Data Fetching --- 
async function getUserPromptDetails(normalizedUsername: string): Promise<PromptDetails> {
  const existingDetails = await getUserDetails(normalizedUsername);

  if (existingDetails) {
    debugLog.info("API Route: Using existing user details from DB for prompt base");
    // Log raw animalSelection data for debugging
    debugLog.info("API Route: Raw existingDetails.animalSelection:", JSON.stringify(existingDetails.animalSelection));
    debugLog.info("API Route: Type of existingDetails.animalSelection:", typeof existingDetails.animalSelection, Array.isArray(existingDetails.animalSelection));

    // Clean the prompt string from the DB
    let cleanedBasePrompt = existingDetails.prompt;
    if (cleanedBasePrompt && cleanedBasePrompt.toLowerCase().startsWith('prompt:')) {
        cleanedBasePrompt = cleanedBasePrompt.substring(7).trim();
        debugLog.info("API Route: Removed 'prompt:' prefix from cached prompt.");
    }
    // --- Process animalSelection from DB ---
    const animals = processAnimalSelection(existingDetails.animalSelection);
    debugLog.info("API Route: Processed animal selection array:", animals);
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

  // Use shared Langflow integration
  debugLog.info("API Route: Calling Langflow for prompt base");
  const langflowDetails = await fetchLangflowPrompt(normalizedUsername);
  // Clean the languages and githubUrl using existing utils
  return {
    ...langflowDetails,
    cleanedLanguages: cleanLanguagesString(langflowDetails.cleanedLanguages),
    cleanedGithubUrl: cleanGithubUrl(langflowDetails.cleanedGithubUrl, normalizedUsername),
    animalSelection: processAnimalSelection(langflowDetails.animalSelection),
  };
}

export async function POST(request: Request) {
  debugLog.info("API Route: POST function entered.");
  
  // 0. Rate Limiting Check
  const clientIp = getClientIp(request);
  securityLog.info(`[SECURITY:RATE_LIMIT] Checking IP: ${clientIp}`);
  
  const rateLimitResult = await checkRateLimit(clientIp);
  
  if (!rateLimitResult.success) {
    securityLog.warn(`[SECURITY:RATE_LIMIT] BLOCKED - IP: ${clientIp}, Limit: ${rateLimitResult.limit}, Reset: ${new Date(rateLimitResult.reset).toISOString()}`);
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        }
      }
    );
  }
  
  securityLog.info(`[SECURITY:RATE_LIMIT] ALLOWED - IP: ${clientIp}, Remaining: ${rateLimitResult.remaining}/${rateLimitResult.limit}`);
  
  let username: string | undefined;
  let emotion: string | undefined;
  let processedImageDataUri: string | undefined;
  let originalImageMimeType: string | undefined;
  let imageProvided = false; // Flag if image was part of the request

  // 1. Parse Request
  try {
    const contentType = request.headers.get('content-type');
    debugLog.info("API Route: Content-Type:", contentType);

    if (contentType?.includes('multipart/form-data')) {
      debugLog.info("API Route: Processing FormData...");
      const formData = await request.formData();
      username = formData.get('username') as string | undefined;
      emotion = formData.get('emotion') as string | undefined;
      const file = formData.get('imageFile');

      if (file instanceof File && file.size > 0) {
        imageProvided = true;
        securityLog.info(`[SECURITY:FILE_UPLOAD] Received file - Name: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes, IP: ${clientIp}`);
        
        // Validate file upload
        const validationResult = await validateUploadedFile(file);
        logFileUpload(clientIp, file.name, file.size, validationResult.valid, validationResult.error);
        
        if (!validationResult.valid) {
          securityLog.error(`[SECURITY:FILE_UPLOAD] VALIDATION FAILED - IP: ${clientIp}, File: ${file.name}, Reason: ${validationResult.error}`);
          return NextResponse.json(
            { error: validationResult.error || "Invalid file upload" },
            { status: 400 }
          );
        }
        
        securityLog.info(`[SECURITY:FILE_UPLOAD] VALIDATION PASSED - IP: ${clientIp}, File: ${file.name}`);
        originalImageMimeType = validationResult.mimeType || file.type;
        
        // Sanitize and process the image
        let imageBuffer = Buffer.from(new Uint8Array(await file.arrayBuffer()));
        try {
          const sanitized = await sanitizeImage(imageBuffer);
          imageBuffer = Buffer.from(sanitized.buffer);
          originalImageMimeType = sanitized.mimeType;
          
          const metadata = await sharp(imageBuffer).metadata();
          securityLog.info(`[SECURITY:FILE_UPLOAD] SANITIZED - IP: ${clientIp}, Dimensions: ${metadata.width}x${metadata.height}, Format: ${sanitized.mimeType}`);
        } catch (sanitizeError) {
          securityLog.error(`[SECURITY:FILE_UPLOAD] SANITIZATION FAILED - IP: ${clientIp}, File: ${file.name}, Error: ${sanitizeError}`);
          return NextResponse.json(
            { error: "Failed to process image" },
            { status: 400 }
          );
        }
        
        processedImageDataUri = bufferToDataURI(imageBuffer, originalImageMimeType);
        securityLog.info(`[SECURITY:FILE_UPLOAD] PROCESSING COMPLETE - IP: ${clientIp}, Data URI length: ${processedImageDataUri?.length}`);
      } else {
        debugLog.info("API Route: No valid image file found in FormData.");
      }
    } else if (contentType?.includes('application/json')) {
      debugLog.info("API Route: Processing JSON...");
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

  // 2. Validate Inputs with Zod
  const validation = safeValidate(generatePromptSchema, { username, emotion });
  
  if (!validation.success) {
    securityLog.warn(`[SECURITY:VALIDATION] Generate prompt validation failed - IP: ${clientIp}, Error: ${validation.error}`);
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  
  // Extract validated and normalized data
  const validatedUsername = validation.data.username; // Already lowercase
  const validatedEmotion = validation.data.emotion;
  
  // Additional check for emotion (defense in depth)
  if (!validatedEmotion) {
    console.error("Invalid or missing emotion after validation:", validatedEmotion);
    return NextResponse.json({ error: "Valid emotion is required" }, { status: 400 });
  }

  // Sanitize username for database operations (defense in depth)
  const normalizedUsername = validateAndSanitizeUsername(validatedUsername);
  debugLog.info("API Route: Validated and sanitized username:", normalizedUsername);
  securityLog.info(`[SECURITY:VALIDATION] Input validation passed - Username: ${normalizedUsername}, Emotion: ${validatedEmotion}, IP: ${clientIp}`);

  // 3. Process Request (Analyze Image if provided, then Txt2Img)
  try {
    debugLog.info("API Route: Starting generation processing...");
    let promptDetails: PromptDetails | null = null;
    let finalPrompt: string;
    let imageResult: { imageUrl: string; success: boolean };
    let imageAnalysisDescription: string | null = null;
    let promptSourceType: 'cache' | 'langflow' | 'image_analysis' = 'langflow';

    // --- Image Analysis Step (if image provided) ---
    if (imageProvided && processedImageDataUri) {
        debugLog.info("API Route: Attempting image analysis...");
        imageAnalysisDescription = await analyzeImageWithOpenAI(processedImageDataUri);
        // Log analysis result but don't set promptSourceType here yet
        debugLog.info("API Route: Image analysis completed (result:", imageAnalysisDescription ? "Success" : "Failed/Skipped", ")");
        if (!imageAnalysisDescription) {
             debugLog.warn("API Route: Analysis failed/skipped, proceeding without feature injection in prompt.");
        }
    }
    
    // --- Get Base Prompt Details (Always needed) ---
    debugLog.info("API Route: Attempting to get user prompt details...");
    promptDetails = await getUserPromptDetails(normalizedUsername);
    debugLog.info("API Route: Got user prompt details. Source:", promptDetails.source);
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
        debugLog.info("API Route: Building prompt from DB/Langflow base prompt (no analysis used).");
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

    debugLog.info("API Route: Final prompt for EverArt Txt2Img:", finalPrompt);

    // --- Generate Image (Always Txt2Img now) ---
    debugLog.info("API Route: Attempting Txt2Img generation...");
    imageResult = await generateImage(finalPrompt, 'txt2img', {}, FALLBACK_IMAGE_URL);

    // --- Save Generation Result to DB --- 
    if (imageResult.success) {
        try {
            debugLog.info(`API Route: Upserting image for ${normalizedUsername}`);
            await upsertImage({
                username: normalizedUsername,
                image_url: imageResult.imageUrl,
                created_at: new Date().toISOString()
            });
            debugLog.info(`API Route: Upsert successful for ${normalizedUsername}`);
        } catch (dbError) {
            console.error(`API Route: Failed to upsert image for ${normalizedUsername}:`, dbError);
        }
    }

    // 4. Format and Return Response
    return NextResponse.json<GeneratePromptResponse>({
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
    return NextResponse.json<GeneratePromptErrorResponse>(
      { 
        error: errorMessage,
        username: normalizedUsername,
        status: { general: "error" }
      },
      { status: 500 }
    );
  }
} 