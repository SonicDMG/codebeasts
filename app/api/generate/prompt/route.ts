import { NextResponse } from "next/server";
import EverArt from 'everart';
import { getUserDetails, upsertImage } from "../../../lib/db/astra";

// Add the GITHUB_USERNAME_REGEX (from code-beast-generator.tsx)
const GITHUB_USERNAME_REGEX = /^([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})$/;

// Define the allowed emotions (same as client-side)
const ALLOWED_EMOTIONS = [
  "Zen/Godlike", "Ecstatic", "Angry", "Surprised", "Legendary",
  "Exploding Head", "Crying", "Zombie", "Ghibli Scene in rolling meadows", "Caped Crusader",
  "Action Figure"
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
  "Rainbow gradient background.";

// Local fallback image that doesn't depend on external services
const FALLBACK_IMAGE_URL = "/images/codebeast-placeholder.png";

// New prompt template for Action Figure
const ACTION_FIGURE_PROMPT_TEMPLATE = "Close-up product shot on white background: detailed toy blister pack with [character description] action figure. Red header band reads '[Name] the [Title]' in bold white text. Includes 'Ages [X]+' label, accessories in separate compartments ([key items]). Professional retail packaging with clear plastic bubble, detailed labeling, and product information. Sharp focus on packaging details";

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

// Keep bufferToDataURI helper, but input is ArrayBuffer now
function bufferToDataURI(buffer: ArrayBuffer, mimeType: string): string {
  return `data:${mimeType};base64,${Buffer.from(buffer).toString('base64')}`;
}

export async function POST(request: Request) {
  console.log("API Route: POST function entered.");
  let username: string | undefined;
  let emotion: string | undefined;
  let imageFile: File | undefined;
  let imageDataUri: string | undefined;
  let isFormDataRequest = false;

  try {
    const contentType = request.headers.get('content-type');
    console.log("API Route: Content-Type:", contentType);

    if (contentType?.includes('multipart/form-data')) {
      isFormDataRequest = true;
      console.log("API Route: Processing FormData using request.formData()...");
      const formData = await request.formData();
      username = formData.get('username') as string | undefined;
      emotion = formData.get('emotion') as string | undefined;
      const file = formData.get('imageFile');

      if (file instanceof File && file.size > 0) {
        imageFile = file;
        console.log("API Route: Image file received:", imageFile.name, imageFile.type, imageFile.size);
        // Convert File to base64 data URI immediately
        const imageBuffer = await imageFile.arrayBuffer();
        imageDataUri = bufferToDataURI(imageBuffer, imageFile.type);
        console.log("API Route: Converted image to Data URI (length:", imageDataUri?.length, ")");
      } else {
        console.log("API Route: No valid image file found in FormData.");
      }

    } else if (contentType?.includes('application/json')) {
      console.log("API Route: Processing JSON...");
      const body = await request.json();
      console.log("API Route: Received JSON body:", body);
      username = body.username;
      emotion = body.emotion;
    } else {
      console.warn("API Route: Unsupported Content-Type:", contentType);
      return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 415 });
    }

    // --- Validation (remains the same) ---
    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username.trim())) {
      console.error("Invalid or missing username:", username);
      return NextResponse.json({ error: "Valid GitHub username is required" }, { status: 400 });
    }
    if (!emotion || typeof emotion !== 'string' || !ALLOWED_EMOTIONS.includes(emotion)) {
      console.error("Invalid or missing emotion:", emotion);
      return NextResponse.json({ error: `Invalid emotion selected. Must be one of: ${ALLOWED_EMOTIONS.join(', ')}` }, { status: 400 });
    }
    // --- End Validation ---

    const normalizedUsername = username.trim().toLowerCase();

    // -------- Image-to-Image Path (if image was processed from FormData) --------
    if (isFormDataRequest && imageFile && imageDataUri) {
      console.log("API Route: Entering Img2Img Path");
      try {
        // 1. Get base prompt details (same logic as before)
        let basePrompt: string;
        let cleanedLanguages = '';
        let cleanedGithubUrl = `https://github.com/${normalizedUsername}`;
        let repoCount: number | undefined;
        let animalSelection: string | undefined;
        let promptSource: 'cache' | 'langflow';

        const existingDetails = await getUserDetails(normalizedUsername);
        if (existingDetails) {
          console.log("API Route (Img2Img): Using existing user details from DB for prompt base");
          basePrompt = existingDetails.prompt;
          cleanedLanguages = cleanLanguagesString(existingDetails.languages);
          cleanedGithubUrl = cleanGithubUrl(existingDetails.githubUrl, normalizedUsername);
          repoCount = existingDetails.repoCount;
          animalSelection = typeof existingDetails.animalSelection === 'string' ? existingDetails.animalSelection : undefined;
          promptSource = 'cache';
        } else {
          console.log("API Route (Img2Img): Calling Langflow for prompt base");
          // ... (Langflow call logic remains the same) ...
          const langflowUrl = `${process.env.LANGFLOW_BASE_URL}/api/v1/run/${process.env.LANGFLOW_FLOW_ID}`;
          const langflowResponse = await fetch(langflowUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: normalizedUsername })});
          if (!langflowResponse.ok) throw new Error("Langflow call failed for img2img base prompt");
          const langflowResponseData = await langflowResponse.json();
          let rawMessage = langflowResponseData?.outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message;
          if (!rawMessage) throw new Error("Could not extract message from Langflow for img2img");
          const messageParts = rawMessage.split('|').map((field: string) => field.trim());
          const [rawLanguages, promptText, rawGithubUrl, rawRepoCount] = messageParts;
          basePrompt = promptText;
          cleanedLanguages = cleanLanguagesString(rawLanguages);
          cleanedGithubUrl = cleanGithubUrl(rawGithubUrl, normalizedUsername);
          const count = parseInt(rawRepoCount, 10);
          repoCount = !isNaN(count) ? count : undefined;
          promptSource = 'langflow';
        }

        // 2. Build the final prompt (same logic as before)
        let finalPrompt: string;
        if (emotion === "Action Figure") {
          finalPrompt = buildActionFigurePrompt(normalizedUsername, basePrompt, animalSelection, cleanedLanguages);
        } else {
          finalPrompt = `A ${emotion} ${PROMPT_PREFIX}${basePrompt}`;
        }
        console.log("API Route (Img2Img): Final prompt:", finalPrompt);

        // 3. Call EverArt for Img2Img (using imageDataUri)
        console.log("API Route (Img2Img): Calling EverArt create...");
        const generations = await everart.v1.generations.create(
          '5000',
          finalPrompt,
          'img2img',
          {
            image: imageDataUri, // Pass the base64 data URI
            imageCount: 1,
            height: 512,
            width: 512
          }
        ) as Generation[];

        if (!generations || generations.length === 0) {
          throw new Error('No generations returned from EverArt (img2img)');
        }

        const result = await everart.v1.generations.fetchWithPolling(generations[0].id) as Generation;
        console.log("EverArt generation result (img2img path):", result);
        const finalImageUrl = result.image_url || FALLBACK_IMAGE_URL;

        // Skipping DB upsert for img2img results for now

        // 4. Return result
        return NextResponse.json({
          languages: cleanedLanguages,
          prompt: basePrompt,
          githubUrl: cleanedGithubUrl,
          repoCount: repoCount,
          animalSelection: animalSelection,
          imageUrl: finalImageUrl,
          username: normalizedUsername,
          isImg2Img: true,
          status: {
            promptSource: promptSource,
            everart: result.image_url ? 'success' : 'error'
          },
        });

      } catch (img2imgError) {
        console.error("Error in Img2Img Path:", img2imgError);
        return NextResponse.json({
          error: img2imgError instanceof Error ? img2imgError.message : "Failed during image-to-image generation",
          username: normalizedUsername,
          imageUrl: FALLBACK_IMAGE_URL,
          isImg2Img: true,
          status: { everart: 'error' }
        }, { status: 500 });
      }
    }

    // -------- Text-to-Image Path (JSON request or FormData without image) --------
    console.log("API Route: Entering Txt2Img Path (JSON or FormData without image)");
    try {
        // ... (Existing txt2img logic using cache) ...
        const existingDetails = await getUserDetails(normalizedUsername);
        if (existingDetails) {
            console.log("API Route: Using existing user details from DB (txt2img)");
            // ... (rest of cache path logic is identical) ...
            // ... Make sure to return isImg2Img: false ...
             const cleanedLanguages = cleanLanguagesString(existingDetails.languages);
            const cleanedGithubUrl = cleanGithubUrl(existingDetails.githubUrl, normalizedUsername);
            const animalSelection = typeof existingDetails.animalSelection === 'string' ? existingDetails.animalSelection : undefined;

            try {
              let fullPrompt: string;
              if (emotion === "Action Figure") {
                 fullPrompt = buildActionFigurePrompt(normalizedUsername, existingDetails.prompt, animalSelection, cleanedLanguages);
              } else {
                fullPrompt = `A ${emotion} ${PROMPT_PREFIX}${existingDetails.prompt}`;
              }
              console.log("Full prompt for existing user (txt2img):", fullPrompt);
              const generations = await everart.v1.generations.create('5000', fullPrompt, 'txt2img', { imageCount: 1, height: 512, width: 512 }) as Generation[];
              if (!generations || generations.length === 0) throw new Error('No generations returned from EverArt');
              const result = await everart.v1.generations.fetchWithPolling(generations[0].id) as Generation;
              const finalImageUrl = result.image_url || FALLBACK_IMAGE_URL;
              if (result.image_url) { try { await upsertImage({ username: normalizedUsername, image_url: finalImageUrl, created_at: new Date().toISOString() }); } catch (dbError) { console.error(`Failed to upsert image (cached txt2img):`, dbError); } }
              return NextResponse.json({ languages: cleanedLanguages, prompt: existingDetails.prompt, githubUrl: cleanedGithubUrl, repoCount: existingDetails.repoCount, animalSelection: animalSelection, imageUrl: finalImageUrl, isImg2Img: false, status: { langflow: "cached", everart: result.image_url ? "success" : "error" }, source: 'cache', username: normalizedUsername });
            } catch (everartError) {
               console.error("Error calling EverArt API (cached txt2img path):", everartError);
               return NextResponse.json({ languages: cleanedLanguages, prompt: existingDetails.prompt, githubUrl: cleanedGithubUrl, repoCount: existingDetails.repoCount, animalSelection: animalSelection, imageUrl: FALLBACK_IMAGE_URL, isImg2Img: false, status: { langflow: "cached", everart: "error" }, source: 'cache', username: normalizedUsername });
            }
        }

        // ... (Existing txt2img logic using Langflow) ...
        console.log("API Route: No existing details found, calling Langflow (txt2img path)");
        // ... (rest of Langflow path logic is identical) ...
        // ... Make sure to return isImg2Img: false ...
        if (!process.env.LANGFLOW_BASE_URL || !process.env.LANGFLOW_FLOW_ID || !process.env.EVERART_API_KEY) { /* ... env check ... */ }
        const langflowUrl = `${process.env.LANGFLOW_BASE_URL}/api/v1/run/${process.env.LANGFLOW_FLOW_ID}`;
        try {
          const response = await fetch(langflowUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: normalizedUsername }) });
          if (!response.ok) { /* ... langflow error ... */ const errorText = await response.text(); throw new Error(`Langflow API error: ${response.status} ${errorText}`); }
          const langflowResponseData = await response.json();
          let rawMessage = langflowResponseData?.outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message;
          if (!rawMessage) { throw new Error("Could not find message in Langflow response (txt2img)"); }
          const messageParts = rawMessage.split('|').map((field: string) => field.trim());
          const [rawLanguages, prompt, rawGithubUrl, rawRepoCount] = messageParts;
          const count = parseInt(rawRepoCount, 10); const repoCount = !isNaN(count) ? count : undefined;
          const cleanedLanguages = cleanLanguagesString(rawLanguages); const cleanedGithubUrl = cleanGithubUrl(rawGithubUrl, normalizedUsername);
          const newDataToLog = { languages: cleanedLanguages, prompt, githubUrl: cleanedGithubUrl, repoCount, animalSelection: undefined };
          try {
            let fullPrompt: string;
            if (emotion === "Action Figure") {
              fullPrompt = buildActionFigurePrompt(normalizedUsername, newDataToLog.prompt, newDataToLog.animalSelection, cleanedLanguages);
            } else {
              fullPrompt = `A ${emotion} ${PROMPT_PREFIX}${newDataToLog.prompt}`;
            }
            console.log("Full prompt for new user (txt2img):", fullPrompt);
            const generations = await everart.v1.generations.create('5000', fullPrompt, 'txt2img', { imageCount: 1, height: 512, width: 512 }) as Generation[];
            if (!generations || generations.length === 0) throw new Error('No generations returned from EverArt (Langflow txt2img)');
            const result = await everart.v1.generations.fetchWithPolling(generations[0].id) as Generation;
            const finalImageUrl = result.image_url || FALLBACK_IMAGE_URL;
            if (result.image_url) { try { await upsertImage({ username: normalizedUsername, image_url: finalImageUrl, created_at: new Date().toISOString() }); } catch (dbError) { console.error(`Failed to upsert image (Langflow txt2img):`, dbError); } }
            return NextResponse.json({ languages: newDataToLog.languages, prompt: newDataToLog.prompt, githubUrl: newDataToLog.githubUrl, repoCount: newDataToLog.repoCount, animalSelection: newDataToLog.animalSelection, imageUrl: finalImageUrl, username: normalizedUsername, isImg2Img: false, status: { langflow: "success", everart: result.image_url ? "success" : "error" }, source: 'langflow' });
          } catch (everartError) {
            console.error("Error calling EverArt API (Langflow txt2img path):", everartError);
            return NextResponse.json({ languages: newDataToLog.languages, prompt: newDataToLog.prompt, githubUrl: newDataToLog.githubUrl, repoCount: newDataToLog.repoCount, animalSelection: newDataToLog.animalSelection, imageUrl: FALLBACK_IMAGE_URL, username: normalizedUsername, isImg2Img: false, status: { langflow: "success", everart: "error" }, source: 'langflow' });
          }
        } catch (langflowError) {
          console.error("Error calling Langflow API (txt2img path):", langflowError);
          return NextResponse.json({ error: "Failed to communicate with Langflow API", username: normalizedUsername, isImg2Img: false, status: { langflow: "error", everart: "not_started" } }, { status: 500 });
        }

    } catch (error) {
       // General error handler for txt2img path
       console.error("Error in API route (txt2img path):", error);
        return NextResponse.json({
          error: "Failed to generate prompt (txt2img path)",
          username: normalizedUsername, // Use username if available
          isImg2Img: false,
          status: { general: "error" }
        }, { status: 500 });
    }

  } catch (error) {
    // Top-level error handler (e.g., for parsing issues)
    console.error("Error processing request:", error);
    const finalUsername = typeof username === 'string' ? username.trim().toLowerCase() : undefined;
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to process request", 
        username: finalUsername,
        status: { general: "error" }
      },
      { status: 500 }
    );
  }
} 