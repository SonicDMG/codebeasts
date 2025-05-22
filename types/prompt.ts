/**
 * types/prompt.ts
 *
 * Shared TypeScript types for prompt generation and Langflow integration in Code Beasts.
 */

export type PromptDetails = {
  basePrompt: string;
  cleanedLanguages: string;
  cleanedGithubUrl: string;
  repoCount: number | undefined;
  animalSelection: (string | string[])[] | undefined;
  source: 'cache' | 'langflow';
}; 