import { NextRequest, NextResponse } from 'next/server';

// Add the GITHUB_USERNAME_REGEX
const GITHUB_USERNAME_REGEX = /^([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})$/;
// Define expected image host prefix
const ALLOWED_IMAGE_PREFIX = 'https://storage.googleapis.com/'; // Adjust if EverArt URL changes

export async function GET(request: NextRequest) {
  await request.nextUrl.searchParams;
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get('url');
  const username = searchParams.get('username'); 

  // 1. Validate imageUrl
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith(ALLOWED_IMAGE_PREFIX)) {
    console.error("Invalid or missing image URL:", imageUrl);
    return new NextResponse('Invalid or missing image URL parameter', { status: 400 });
  }

  // 2. Validate username format
  if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
    console.error("Invalid or missing username format:", username);
    return new NextResponse('Invalid or missing username parameter', { status: 400 });
  }

  // --- Inputs validated ---

  try {
    // Fetch the image server-side (bypasses browser CORS)
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      // Pass through the error status from the original image server
      return new NextResponse(`Failed to fetch image: ${imageResponse.statusText}`, {
        status: imageResponse.status,
      });
    }

    // Get the image data as a blob
    const imageBlob = await imageResponse.blob();

    // Determine content type (default to png if not available)
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    // Construct filename safely using validated username
    const filename = `codebeast-${username}.png`;

    // Create a new response with the image data and correct headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return new NextResponse(imageBlob, { status: 200, headers });

  } catch (error) {
    console.error("API download route error:", error);
    return new NextResponse('Error downloading image', { status: 500 });
  }
} 