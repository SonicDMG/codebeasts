import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get('url');
  const username = searchParams.get('username'); // Get username for filename

  if (!imageUrl) {
    return new NextResponse('Missing image URL', { status: 400 });
  }

  if (!username) {
    return new NextResponse('Missing username for filename', { status: 400 });
  }

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