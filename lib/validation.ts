/**
 * Zod validation schemas for API endpoints
 * 
 * Provides type-safe runtime validation for all user inputs
 * to prevent injection attacks, data corruption, and API abuse.
 */

import { z } from 'zod';

// ============================================================================
// GITHUB USERNAME VALIDATION
// ============================================================================

/**
 * GitHub username validation
 * Rules:
 * - 1-39 characters
 * - Alphanumeric and hyphens only
 * - Cannot start or end with hyphen
 * - Cannot have consecutive hyphens
 */
export const githubUsernameSchema = z
  .string()
  .min(1, 'Username is required')
  .max(39, 'Username must be 39 characters or less')
  .regex(
    /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/,
    'Invalid GitHub username format'
  )
  .transform(val => val.toLowerCase()); // Normalize to lowercase

// ============================================================================
// EMOTION/STYLE VALIDATION
// ============================================================================

/**
 * Allowed emotion/style options for image generation
 */
export const ALLOWED_EMOTIONS = [
  'Action Figure',
  'Zen/Godlike',
  'Ecstatic',
  'Angry',
  'Surprised',
  'Legendary',
  'Exploding Head',
  'Crying',
  'Zombie',
  'Ghibli Scene in rolling meadows',
  'Caped Crusader',
] as const;

export const emotionSchema = z
  .string()
  .min(1, 'Emotion is required')
  .max(100, 'Emotion must be 100 characters or less')
  .refine(
    (val) => ALLOWED_EMOTIONS.includes(val as any),
    {
      message: `Emotion must be one of: ${ALLOWED_EMOTIONS.join(', ')}`,
    }
  );

// ============================================================================
// URL VALIDATION
// ============================================================================

/**
 * Image URL validation
 * Must be HTTPS and from allowed domains
 */
export const imageUrlSchema = z
  .string()
  .url('Invalid URL format')
  .startsWith('https://', 'URL must use HTTPS')
  .max(2048, 'URL too long')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        const allowedDomains = [
          'everart.ai',
          'storage.googleapis.com',
          'githubusercontent.com',
        ];
        return allowedDomains.some(domain => 
          parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
        );
      } catch {
        return false;
      }
    },
    {
      message: 'URL must be from an allowed domain (everart.ai, googleapis.com, or githubusercontent.com)',
    }
  );

// ============================================================================
// API ENDPOINT SCHEMAS
// ============================================================================

/**
 * Schema for POST /api/generate/prompt
 * Validates image generation request
 */
export const generatePromptSchema = z.object({
  username: githubUsernameSchema,
  emotion: emotionSchema,
  // File upload is handled separately via multipart/form-data
});

export type GeneratePromptInput = z.infer<typeof generatePromptSchema>;

/**
 * Schema for POST /api/gallery
 * Validates gallery image submission
 */
export const galleryPostSchema = z.object({
  username: githubUsernameSchema,
  image_url: imageUrlSchema,
});

export type GalleryPostInput = z.infer<typeof galleryPostSchema>;

/**
 * Schema for GET /api/images/[username]
 * Validates username parameter
 */
export const usernameParamSchema = z.object({
  username: githubUsernameSchema,
});

export type UsernameParamInput = z.infer<typeof usernameParamSchema>;

// ============================================================================
// DATABASE QUERY SANITIZATION
// ============================================================================

/**
 * Sanitize string for database queries
 * Prevents NoSQL injection by escaping special characters
 */
export function sanitizeForDb(input: string): string {
  // Remove or escape characters that could be used in NoSQL injection
  return input
    .replace(/[\$\{\}]/g, '') // Remove $, {, }
    .replace(/['"]/g, '') // Remove quotes
    .trim();
}

/**
 * Validate and sanitize username for database operations
 */
export function validateAndSanitizeUsername(username: unknown): string {
  const validated = githubUsernameSchema.parse(username);
  return sanitizeForDb(validated);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Safe validation that returns result object instead of throwing
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Validation failed',
      };
    }
    return { success: false, error: 'Validation failed' };
  }
}

/**
 * Validate request body and return typed data or error response
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string; status: number }> {
  try {
    const body = await request.json();
    const result = safeValidate(schema, body);
    
    if (!result.success) {
      return { success: false, error: result.error, status: 400 };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid JSON in request body',
      status: 400,
    };
  }
}

// ============================================================================
// GITHUB API RESPONSE VALIDATION
// ============================================================================

/**
 * Schema for GitHub API user response
 * Validates external API data before using it
 */
export const githubUserSchema = z.object({
  login: z.string(),
  name: z.string().nullable(),
  bio: z.string().nullable(),
  public_repos: z.number(),
  followers: z.number(),
  following: z.number(),
  created_at: z.string(),
  avatar_url: z.string().url().optional(),
  html_url: z.string().url().optional(),
});

export type GitHubUser = z.infer<typeof githubUserSchema>;

/**
 * Schema for GitHub API repository response
 */
export const githubRepoSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  html_url: z.string().url().optional(),
});

export type GitHubRepo = z.infer<typeof githubRepoSchema>;

/**
 * Validate GitHub API response
 */
export function validateGitHubUser(data: unknown): GitHubUser | null {
  try {
    return githubUserSchema.parse(data);
  } catch (error) {
    console.error('GitHub API response validation failed:', error);
    return null;
  }
}

/**
 * Validate array of GitHub repositories
 */
export function validateGitHubRepos(data: unknown): GitHubRepo[] {
  try {
    const arraySchema = z.array(githubRepoSchema);
    return arraySchema.parse(data);
  } catch (error) {
    console.error('GitHub repos validation failed:', error);
    return [];
  }
}

// Made with Bob