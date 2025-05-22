// types/api.ts

import type { ImageRecord } from "@/lib/db/astra";
import type { PromptDetails } from "@/app/api/generate/prompt/types";

// Gallery API
export type GalleryGetResponse = ImageRecord[];
export type GalleryPostResponse = any; // upsertImage result (could be refined)

// Images/[username] API
export type UserImageGetResponse = ImageRecord | { error: string };

// Proxy Image API
// Returns image binary or error string, so not a JSON response

// Download API
// Returns image binary or error string, so not a JSON response

// Generate/Prompt API
export interface GeneratePromptResponse {
  languages: string;
  prompt: string;
  imageAnalysis: string | null;
  githubUrl: string;
  repoCount: number | undefined;
  animalSelection: (string | string[])[] | undefined;
  imageUrl: string;
  username: string;
  isImg2Img: boolean;
  status: {
    promptSource: string;
    everart: string;
    analysis: string;
  };
  source: string;
}
export interface GeneratePromptErrorResponse {
  error: string;
  username?: string;
  status: { general: string };
}

// Generate/Image API (and EverArt generate)
export interface GenerateImageResponse {
  url: string;
}
export interface GenerateImageErrorResponse {
  error: string;
} 