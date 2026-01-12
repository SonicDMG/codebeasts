import { NextRequest, NextResponse } from "next/server";
import { getAllImages, upsertImage } from "@/lib/db/astra";
import type { ImageRecord } from "@/lib/db/astra";
import type { GalleryGetResponse, GalleryPostResponse } from "@/types/api";
import { validateRequestBody, galleryPostSchema } from "@/lib/validation";
import { securityLog } from "@/lib/logger";

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
    
    // Validate request body with Zod
    const validation = await validateRequestBody(request, galleryPostSchema);
    
    if (!validation.success) {
      securityLog.warn(`[SECURITY:VALIDATION] Gallery POST validation failed: ${validation.error}`);
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const { username, image_url } = validation.data;
    console.log("POST /api/gallery - Validated data:", { username, image_url });

    const imageRecord: Omit<ImageRecord, '_id'> = {
      username,
      image_url,
      created_at: new Date().toISOString()
    };

    const result = await upsertImage(imageRecord);
    securityLog.info(`[SECURITY:GALLERY] Image record created/updated for user: ${username}`);
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