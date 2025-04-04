import { Metadata } from "next";
import { BeastCard } from "@/components/gallery/BeastCard";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ImageRecord } from "@/app/api/db/astra";

interface DirectPageProps {
  params: {
    username: string;
  };
}

function getBaseUrl(): string {
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  return `${protocol}://${process.env.VERCEL_URL || "localhost:3000"}`;
}

async function getImageForUser(username: string): Promise<ImageRecord | null> {
  try {
    const baseUrl = getBaseUrl();
    console.log("Fetching image for user:", username);
    console.log("Using base URL:", baseUrl);
    
    const response = await fetch(`${baseUrl}/api/images/${username}`, { cache: 'no-store' });
    if (!response.ok) {
      if (response.status === 404) {
        console.log("No image found for user:", username);
        return null;
      }
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const data = await response.json();
    console.log("Found image:", data);
    return data;
  } catch (error) {
    console.error("Error fetching image:", error);
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
    <div className="min-h-screen flex flex-col px-4 py-4">
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <Card className="p-6 space-y-4">
            {image ? (
              <>
                <h1 className="text-2xl font-bold text-center break-words">
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
    </div>
  );
} 