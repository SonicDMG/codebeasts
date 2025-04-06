// Import types for the tools
type EverArtGenerateImageParams = {
  prompt: string;
  model?: string;
  image_count?: number;
};

type EverArtGenerateImageResponse = {
  response: string;
};

// Export the EverArt tool
export async function mcp_everart_generate_image(params: EverArtGenerateImageParams): Promise<EverArtGenerateImageResponse> {
  // @ts-ignore - MCP tool is injected into the global scope
  const result = await global.mcp_everart_generate_image({
    prompt: params.prompt,
    model: params.model || "5000",
    image_count: params.image_count || 1
  });

  return { response: result };
} 