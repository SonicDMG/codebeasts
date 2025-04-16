/**
 * types.ts
 *
 * Shared TypeScript types for prompt generation and API logic in Code Beasts.
 */

/**
 * Type for user prompt details used in prompt generation.
 */
export type PromptDetails = {
  basePrompt: string;
  cleanedLanguages: string;
  cleanedGithubUrl: string;
  repoCount: number | undefined;
  animalSelection: string[] | undefined;
  source: 'cache' | 'langflow';
}; 