import { Metadata } from "next";
import { BeastCard } from "@/app/components/gallery/BeastCard";
import { Card } from "@/app/components/ui/card";
import Link from "next/link";
import { ImageRecord } from "@/app/api/db/astra";

interface DirectPageProps {
  params: {
    username: string;
  };
}

function getBaseUrl(): string {
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const vercelUrl = process.env.VERCEL_URL;
  const host = vercelUrl ? `${protocol}://${vercelUrl}` : `${protocol}://localhost:3000`;
  const url = appUrl || host;
  console.log(`getBaseUrl: protocol=${protocol}, appUrl=${appUrl}, vercelUrl=${vercelUrl}, host=${host}, finalUrl=${url}`);
  return url;
}

async function getImageForUser(username: string): Promise<ImageRecord | null> {
  let response: Response | null = null;
  let fetchUrl = '';
  try {
    const baseUrl = getBaseUrl();
    fetchUrl = `${baseUrl}/api/images/${username}`;
    console.log(`getImageForUser: Fetching image for user: ${username}`);
    console.log(`getImageForUser: Attempting to fetch URL: ${fetchUrl}`);
    
    response = await fetch(fetchUrl, { cache: 'no-store' });
    console.log(`getImageForUser: Fetch response status: ${response.status}`);

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`getImageForUser: No image found (404) for user: ${username} at URL: ${fetchUrl}`);
        return null;
      }
      const errorText = await response.text().catch(() => 'Could not read error text');
      console.error(`getImageForUser: Failed fetch response. Status: ${response.status}, StatusText: ${response.statusText}, URL: ${fetchUrl}, Body: ${errorText}`);
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log(`getImageForUser: Successfully fetched and parsed image data for ${username}`);
    return data;
  } catch (error) {
    console.error(`getImageForUser: Error during fetch process for URL: ${fetchUrl}. Error:`, error instanceof Error ? error.message : String(error));
    if (response) {
       console.error(`getImageForUser: Error occurred after fetch. Response status was: ${response.status}`);
    }
    return null;
  }
}

export async function generateMetadata({ params }: DirectPageProps): Promise<Metadata> {
  const { username } = params;
  
  return {
    title: `CodeBeast for ${username}`,
    description: `View the unique AI-generated CodeBeast for GitHub user ${username}`,
    openGraph: {
      title: `CodeBeast for ${username}`,
      description: `View the unique AI-generated creature for GitHub user ${username}`,
    },
    twitter: {
      title: `CodeBeast for ${username}`,
      description: `Check out this unique AI-generated GitHub profile creature!`,
      card: 'summary_large_image',
    },
  };
}

export default async function DirectPage({ params }: DirectPageProps) {
  const { username } = params;
  const image = await getImageForUser(username);
  
  return (
    <div className="w-full flex flex-col items-center pt-8">
      <div className="w-full max-w-4xl">
        <Card className="p-6 space-y-4 bg-black/30 border-white/10 rounded-xl">
          {image ? (
            <>
              <h1 className="text-2xl font-bold text-center break-words mb-4">
                CodeBeast for @{username}
              </h1>
              <BeastCard
                beast={{
                  username: image.username,
                  image_url: image.image_url,
                }}
                showActions
              />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center break-words">
                No CodeBeast found for @{username}
              </h1>
              <div className="text-center text-muted-foreground">
                This GitHub user hasn't generated their CodeBeast yet.
              </div>
            </>
          )}
          <div className="text-center">
            <Link 
              href="/"
              className="text-primary hover:underline"
            >
              {image ? "Generate your own CodeBeast" : "Generate a CodeBeast"}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
} 