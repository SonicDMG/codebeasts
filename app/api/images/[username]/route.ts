import { NextRequest, NextResponse } from "next/server";
import { getImageByUsername } from "@/lib/db/astra";
import type { UserImageGetResponse } from "@/types/api";
import { safeValidate, usernameParamSchema, validateAndSanitizeUsername } from "@/lib/validation";
import { securityLog } from "@/lib/logger";

// Applying 'any' workaround for build issue in Next.js 15 RC
export async function GET(
  request: NextRequest,
  context: any // Keep 'any' for build compatibility
) {
  // Ensure params are resolved before accessing
  await context?.params;

  // Access username
  const username = context?.params?.username as string;
  
  // Validate username with Zod
  const validation = safeValidate(usernameParamSchema, { username });
  
  if (!validation.success) {
    securityLog.warn(`[SECURITY:VALIDATION] Invalid username in URL: ${username} - ${validation.error}`);
    return NextResponse.json<UserImageGetResponse>(
      { error: validation.error },
      { status: 400 }
    );
  }

  // Username is validated and normalized (lowercase)
  const normalizedUsername = validation.data.username;

  try {
    console.log(`GET /api/images/${normalizedUsername} - Starting request`);
    
    // Sanitize username for database query (defense in depth)
    const sanitizedUsername = validateAndSanitizeUsername(normalizedUsername);
    const image = await getImageByUsername(sanitizedUsername);

    if (!image) {
      console.log(`GET /api/images/${normalizedUsername} - No image found`);
      return NextResponse.json<UserImageGetResponse>(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    console.log(`GET /api/images/${normalizedUsername} - Returning image:`, image);
    return NextResponse.json<UserImageGetResponse>(image);
  } catch (error) {
    console.error(`GET /api/images/${normalizedUsername} - Error:`, error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json<UserImageGetResponse>(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}