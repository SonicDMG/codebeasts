import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // For now, return mock data
    // TODO: Integrate with Cursor API
    const code = `function example() {
  // This is a mock response
  console.log("Hello from CodeBeasts!");
}`;

    return NextResponse.json({ code });
  } catch (error) {
    console.error("Error generating code:", error);
    return NextResponse.json(
      { error: "Failed to generate code" },
      { status: 500 }
    );
  }
} 