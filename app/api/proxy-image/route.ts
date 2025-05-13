import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get('url');

  // Only allow Google Cloud Storage URLs for security
  if (!imageUrl || !imageUrl.startsWith('https://storage.googleapis.com/')) {
    return new NextResponse('Invalid or missing image URL', { status: 400 });
  }

  try {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return new NextResponse('Failed to fetch image', { status: 502 });
    }
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    const imageBuffer = await imageResponse.arrayBuffer();
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Access-Control-Allow-Origin', '*');
    return new NextResponse(imageBuffer, { status: 200, headers });
  } catch (error) {
    return new NextResponse('Error proxying image', { status: 500 });
  }
} 