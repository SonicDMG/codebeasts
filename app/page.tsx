import CodeBeastGenerator from "@/app/components/code-beast-generator";
import { getImageForUser } from "@/app/lib/data"; // Import data fetching function
import { BeastCard } from "@/app/components/gallery/BeastCard"; // Import BeastCard
import { Card } from "@/app/components/ui/card"; // Need Card for layout
import Link from "next/link"; // Need Link

// Define props to receive searchParams
interface HomePageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function Home({ searchParams }: HomePageProps) {
  const username = typeof searchParams?.u === 'string' ? searchParams.u : null;
  
  // Fetch data only if username exists in searchParams
  const image = username ? await getImageForUser(username) : null;

  // Conditional Rendering
  if (username) {
    // Render the BeastCard view if username is present
    return (
      <div className="w-full flex flex-col items-center pt-8 pb-8">
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
                  showActions // Keep actions consistent with direct page?
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
  } else {
    // Render the default generator view if no username
    return (
      <div className="container mx-auto px-4 pt-8 pb-8 w-full">
        <div className="max-w-4xl w-full mx-auto text-center">
          <div className="flex flex-col items-center justify-center mb-4">
            <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500 text-transparent bg-clip-text tracking-tight">
              Transform Your Code Into a Beast!
              <span className="inline-block ml-2">🐉</span>
            </h1>
            <p className="text-base text-white/70 text-center leading-relaxed mt-1">
              Turn your GitHub profile into a unique AI-generated creature
              <br />
              that reflects your coding prowess
            </p>
          </div>
          <div className="mb-6 flex justify-center"> 
            <img 
              src="/images/logo.png" 
              alt="CodeBeasts Logo" 
              className="w-full max-w-xs rounded-lg shadow-lg transition-transform duration-300 ease-in-out hover:scale-110"
            />
          </div>
          <CodeBeastGenerator />
        </div>
      </div>
    );
  }
} 