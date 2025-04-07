import { NextRequest, NextResponse } from "next/server";
import { getImageByUsername } from "../../../lib/db/astra";

// Applying 'any' workaround for build issue in Next.js 15 RC
export async function GET(
  request: NextRequest,
  context: any // Use 'any' type temporarily
) {
  // Ensure params are resolved before accessing
  await context?.params;

  // Access username safely and assert type
  const username = context?.params?.username as string;
  
  // Add check for username existence after potential 'any' access
  if (!username) {
    return NextResponse.json({ error: "Username parameter missing" }, { status: 400 });
  }

  try {
    console.log(`GET /api/images/${username} - Starting request`);
    const image = await getImageByUsername(username);

    if (!image) {
      console.log(`GET /api/images/${username} - No image found`);
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    console.log(`GET /api/images/${username} - Returning image:`, image);
    return NextResponse.json(image);
  } catch (error) {
    console.error(`GET /api/images/${username} - Error:`, error);
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