import { NextRequest, NextResponse } from "next/server";
import { getImageByUsername } from "../../../lib/db/astra";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const { username } = params;
  
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