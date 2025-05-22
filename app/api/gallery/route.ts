import { NextRequest, NextResponse } from "next/server";
import { getAllImages, upsertImage } from "@/lib/db/astra";
import type { ImageRecord } from "@/lib/db/astra";
import type { GalleryGetResponse, GalleryPostResponse } from "@/types/api";

export async function GET() {
  try {
    console.log("GET /api/gallery - Starting request");
    const records = await getAllImages();
    return NextResponse.json<GalleryGetResponse>(records);
  } catch (error) {
    console.error("GET /api/gallery - Error:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json<{ error: string }>({ error: "Failed to fetch gallery" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/gallery - Starting request");
    const body = await request.json();
    console.log("POST /api/gallery - Request body:", body);

    if (!body.username || !body.image_url) {
      console.error("POST /api/gallery - Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: username and image_url" },
        { status: 400 }
      );
    }

    const imageRecord: Omit<ImageRecord, '_id'> = {
      username: body.username,
      image_url: body.image_url,
      created_at: new Date().toISOString()
    };

    const result = await upsertImage(imageRecord);
    return NextResponse.json<GalleryPostResponse>(result);
  } catch (error) {
    console.error("POST /api/gallery - Error:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json<{ error: string }>({ error: "Failed to create/update image record" }, { status: 500 });
  }
} 