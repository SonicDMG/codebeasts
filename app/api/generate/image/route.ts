import { NextResponse } from "next/server";
import type { GenerateImageResponse, GenerateImageErrorResponse } from "@/types/api";

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
    const response = await fetch("http://localhost:3000/api/everart/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        model,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate image");
    }

    const data = await response.json();
    return NextResponse.json<GenerateImageResponse>(data);
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json<GenerateImageErrorResponse>(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
} 