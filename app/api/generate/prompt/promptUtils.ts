/**
 * promptUtils.ts
 *
 * Utility functions for processing and cleaning data used in prompt generation for the Code Beasts app.
 * Includes helpers for animal selection, language string cleaning, GitHub URL normalization, and prompt construction.
 */

/**
 * Processes the animal selection input from various sources (array, string, or object) and returns a string array of selected animals.
 * @param rawSelection - The raw animal selection data (array, string, or object)
 * @returns An array of animal strings, or undefined if none found
 */
export function processAnimalSelection(rawSelection: any): string[] | undefined {
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

/**
 * Cleans a raw languages string by removing prefixes, brackets, and quotes.
 * @param rawLangString - The raw languages string (may be undefined)
 * @returns A cleaned string of languages
 */
export function cleanLanguagesString(rawLangString: string | undefined): string {
  if (!rawLangString) return '';
  // Remove prefix like "languages:", brackets [], and single quotes '
  return rawLangString.replace(/^languages:\s*\[|\]|'/g, '').trim();
}

/**
 * Normalizes a GitHub URL, extracting the username if present, or falling back to a default URL.
 * @param rawUrl - The raw GitHub URL (may be undefined or malformed)
 * @param username - The GitHub username to use as a fallback
 * @returns A cleaned GitHub profile URL
 */
export function cleanGithubUrl(rawUrl: string | undefined, username: string): string {
  const fallbackUrl = `https://github.com/${username.toLowerCase()}`;
  if (!rawUrl) {
    return fallbackUrl;
  }
  const githubPrefix = 'https://github.com/';
  const index = rawUrl.indexOf(githubPrefix);
  if (index !== -1) {
    return rawUrl.substring(index);
  }
  return fallbackUrl;
}

/**
 * Builds the action figure prompt string by filling in the template with user and selection data.
 * @param promptTemplate - The prompt template string with placeholders
 * @param username - The GitHub username
 * @param figureDescription - The main character description
 * @param animalSelection - Array of animal selection strings
 * @param languages - Cleaned languages string
 * @param baseConceptPrompt - The base concept prompt (for future use)
 * @param personFeatures - Optional: features string for image-based prompts
 * @returns The filled-in prompt string
 */
export function buildActionFigurePrompt(
  promptTemplate: string,
  username: string,
  figureDescription: string,
  animalSelection: string[] | undefined,
  languages: string,
  baseConceptPrompt: string,
  personFeatures?: string
): string {
  const name = username.charAt(0).toUpperCase() + username.slice(1);
  const title = "Code Beast";
  const ages = "All";
  const keyItems = (animalSelection && animalSelection.length > 0)
    ? animalSelection.join(', ')
    : '';
  let prompt = promptTemplate
    .replace('[character description]', figureDescription)
    .replace('[Name]', name)
    .replace('[Title]', title)
    .replace('[X]', ages)
    .replace('[key items]', keyItems);
  if (personFeatures) {
    prompt = prompt.replace('[person_features]', personFeatures);
  }
  return prompt;
} 