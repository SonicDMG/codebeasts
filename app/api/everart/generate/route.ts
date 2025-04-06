import { NextResponse } from "next/server";

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
    const response = await fetch("https://api.everart.ai/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.EVERART_API_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        model,
        image_count: 1,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate image");
    }

    const data = await response.json();

    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
} 