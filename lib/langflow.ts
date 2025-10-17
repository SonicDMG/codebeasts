import type { PromptDetails } from "@/types/prompt";

/**
 * Calls the Langflow API to fetch prompt details for a user.
 * @param normalizedUsername - The normalized GitHub username
 * @returns The parsed prompt details
 * @throws Error if the API call fails or response is invalid
 */
export async function fetchLangflowPrompt(normalizedUsername: string): Promise<PromptDetails> {
  const baseUrl = process.env.LANGFLOW_BASE_URL;
  const flowId = process.env.LANGFLOW_FLOW_ID;
  const apiKey = process.env.LANGFLOW_API_KEY;

  if (!baseUrl || !flowId) {
    throw new Error("Missing Langflow environment variables");
  }

  const langflowUrl = `${baseUrl}/api/v1/run/${flowId}`;
  const langflowResponse = await fetch(langflowUrl, {
    method: "POST",
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey ?? '' },
    body: JSON.stringify({
      input_value: normalizedUsername,
      output_type: "chat",
      input_type: "chat",
      session_id: normalizedUsername
    })
  });

  if (!langflowResponse.ok) {
    const errorText = await langflowResponse.text().catch(() => "");
    throw new Error(`Langflow call failed: ${langflowResponse.statusText} ${errorText}`);
  }
  const langflowResponseData = await langflowResponse.json();
  const rawMessage = langflowResponseData?.outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message;
  if (!rawMessage || typeof rawMessage !== 'string') {
    throw new Error("Could not parse Langflow response");
  }
  const messageParts = rawMessage.split('|').map((field: string) => field.trim());
  if (messageParts.length < 4) {
    throw new Error("Unexpected format from Langflow");
  }
  const [rawLanguages, promptText, rawGithubUrl] = messageParts;
  // Extract num_repositories
  const numReposPart = messageParts.find(part => part.startsWith('num_repositories:'));
  let count = undefined;
  if (numReposPart) {
    const value = numReposPart.replace('num_repositories:', '').trim();
    count = parseInt(value, 10);
  }
  // Extract animal_selection
  const animalSelectionPart = messageParts.find(part => part.startsWith('animal_selection:'));
  let langflowAnimalSelection = undefined;
  if (animalSelectionPart) {
    let value = animalSelectionPart.replace('animal_selection:', '').trim();
    if (value.startsWith('[')) {
      try {
        langflowAnimalSelection = JSON.parse(value.replace(/'/g, '"'));
      } catch (e) {
        // ignore parse error
      }
    }
  }
  return {
    basePrompt: promptText,
    cleanedLanguages: rawLanguages,
    cleanedGithubUrl: rawGithubUrl,
    repoCount: (typeof count === 'number' && !isNaN(count)) ? count : undefined,
    animalSelection: langflowAnimalSelection,
    source: 'langflow',
  };
} 