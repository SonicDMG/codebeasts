/* eslint-env node */
/* global process */
import { NextResponse } from "next/server";
import type { GenerateImageResponse, GenerateImageErrorResponse } from "@/types/api";
import { generateEverArtImage } from "@/lib/everart";

export async function POST(request: Request) {
  try {
    const { prompt, model } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!model) {
      return NextResponse.json(
        { error: "Model is required" },
        { status: 400 }
      );
    }

    // Call the EverArt API to generate the image
    try {
      const data = await generateEverArtImage(prompt, model);
      return NextResponse.json<GenerateImageResponse>(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate image";
      return NextResponse.json<GenerateImageErrorResponse>(
        { error: message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json<GenerateImageErrorResponse>(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
} 