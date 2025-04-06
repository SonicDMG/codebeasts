import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  try {
    const { username, model, repoCount, languages } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    if (!model) {
      return NextResponse.json(
        { error: "Model is required" },
        { status: 400 }
      );
    }

    // Verify Langflow environment variables
    if (!process.env.LANGFLOW_BASE_URL || !process.env.LANGFLOW_FLOW_ID) {
      console.error("Missing Langflow configuration:", {
        baseUrl: !!process.env.LANGFLOW_BASE_URL,
        flowId: !!process.env.LANGFLOW_FLOW_ID
      });
      return NextResponse.json(
        { error: "Langflow configuration is missing" },
        { status: 500 }
      );
    }

    console.log("Calling Langflow API with:", {
      username,
      repoCount,
      languages: languages.join(", ")
    });

    // Call Langflow to generate the CodeBeast prompt
    const langflowUrl = `${process.env.LANGFLOW_BASE_URL}/api/v1/process/${process.env.LANGFLOW_FLOW_ID}`;
    console.log("Langflow URL:", langflowUrl);

    const langflowResponse = await fetch(langflowUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          username,
          repositories: repoCount,
          languages: languages.join(", "),
        },
      }),
    });

    if (!langflowResponse.ok) {
      const errorText = await langflowResponse.text();
      console.error("Langflow API error:", {
        status: langflowResponse.status,
        statusText: langflowResponse.statusText,
        error: errorText
      });
      throw new Error(`Failed to generate CodeBeast prompt: ${langflowResponse.status} ${langflowResponse.statusText}`);
    }

    const langflowData = await langflowResponse.json();
    console.log("Langflow response:", langflowData);

    let prompt;
    if (langflowData.output) {
      prompt = langflowData.output;
    } else if (langflowData.result) {
      prompt = langflowData.result;
    } else if (langflowData.response) {
      prompt = langflowData.response;
    } else {
      console.error("Unexpected Langflow response format:", langflowData);
      throw new Error("Invalid response format from Langflow");
    }

    if (!prompt) {
      throw new Error("No prompt received from Langflow");
    }

    console.log("Generated prompt:", prompt);

    // Map the model selection to EverArt model IDs
    const modelId = model === "stability" ? "7000" : "6000"; // 7000 for Recraft-Real, 6000 for SD3.5

    // Call the EverArt API to generate the image
    const response = await fetch("/api/everart/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        model: modelId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("EverArt API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error("Failed to generate image");
    }

    const data = await response.json();

    // Generate a unique ID for the image
    const id = nanoid();

    return NextResponse.json({ 
      id, 
      url: data.url,
      prompt,
    });
  } catch (error) {
    console.error("Error generating CodeBeast:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate CodeBeast" },
      { status: 500 }
    );
  }
} 