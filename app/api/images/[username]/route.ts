import { NextRequest, NextResponse } from "next/server";
import { getImageByUsername } from "../../../lib/db/astra";

// Add the GITHUB_USERNAME_REGEX
const GITHUB_USERNAME_REGEX = /^([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})$/;

// Applying 'any' workaround for build issue in Next.js 15 RC
export async function GET(
  request: NextRequest,
  context: any // Keep 'any' for build compatibility
) {
  // Ensure params are resolved before accessing
  await context?.params;

  // Access username
  const username = context?.params?.username as string;
  
  // 1. Validate Username Presence and Format
  if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
    console.error("Invalid or missing username format in URL:", username);
    return NextResponse.json(
      { error: "Valid GitHub username required in URL path" },
      { status: 400 }
    );
  }

  // --- Username is now validated ---
  const normalizedUsername = username.toLowerCase(); // Normalize after validation

  try {
    console.log(`GET /api/images/${normalizedUsername} - Starting request`); // Use normalized
    const image = await getImageByUsername(normalizedUsername); // Use normalized

    if (!image) {
      console.log(`GET /api/images/${normalizedUsername} - No image found`); // Use normalized
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    console.log(`GET /api/images/${normalizedUsername} - Returning image:`, image); // Use normalized
    return NextResponse.json(image);
  } catch (error) {
    console.error(`GET /api/images/${normalizedUsername} - Error:`, error); // Use normalized
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
} 