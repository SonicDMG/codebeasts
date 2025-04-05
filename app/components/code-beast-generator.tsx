'use client';

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Image from "next/image";
import { Sparkles, Share2 } from "lucide-react";
import { RepositoryInfo } from "./github/RepositoryInfo";
import NProgress from 'nprogress';

// Function to generate prompt using our API
const generatePrompt = async (username: string) => {
  const response = await fetch('/api/generate/prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to generate prompt: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Share function updated to use index page URL with query param
function shareOnTwitter(username: string) {
  const text = `Check out my unique AI-generated CodeBeast! 🦾\n\nGenerated for @${username} using @LangFlow\n\n`;
  // Construct the index page URL with the username query parameter
  const shareUrl = `${window.location.origin}/?u=${username.toLowerCase()}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
  window.open(twitterUrl, '_blank');
}

export default function CodeBeastGenerator() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<{
    languages: string;
    prompt: string;
    githubUrl: string;
    imageUrl: string;
    repoCount?: number;
    animalSelection?: any[][];
  } | null>(null);

  // Add state for toastId
  const [toastId, setToastId] = useState<string | number | undefined>(undefined);

  const handleGenerate = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    setLoading(true);
    setGeneratedData(null);
    NProgress.configure({ showSpinner: false }); // Disable the spinner
    NProgress.start();
    // Use toast.message for title/description style
    const currentToastId = toast.message("Starting Generation...", { 
      description: "Please wait while we fetch data..."
    }); 
    setToastId(currentToastId); // Store toast ID

    try {
      if (!username.trim()) {
        toast.error("Please enter a GitHub username"); // Keep error simple
        NProgress.done();
        toast.dismiss(currentToastId);
        setLoading(false);
        return;
      }

      // Call the API (which now returns source)
      const data = await generatePrompt(username);
      
      // Step 1: Update toast based on source
      if (data.source === 'cache') {
        toast.message("Found User in DB", { 
          description: "Using saved details...",
          id: currentToastId 
        });
      } else { // source === 'langflow'
        toast.message("Generating Prompt with Langflow AI", { 
          description: "Fetching repository data...", 
          id: currentToastId 
        });
      }
      
      // Step 2: Simulate brief delay and update toast for image generation
      await new Promise(resolve => setTimeout(resolve, 500)); // Short delay 
      toast.message("Generating Image with EverArt AI", { 
        description: "Conjuring pixels... please wait.", 
        id: currentToastId 
      });

      // Step 3: Store data (image appears)
      setGeneratedData(data);

      // Step 4: Final success toast update (after a slight delay to let image render)
      await new Promise(resolve => setTimeout(resolve, 100)); // Short delay
      toast.message("CodeBeast Generated!", { 
        description: "Your unique creature is ready.",
        id: currentToastId 
      });

    } catch (error) {
      // Use title/description for error too
      toast.message("Generation Failed", { 
        description: error instanceof Error ? error.message : "An unknown error occurred",
        id: currentToastId,
        // Use explicit type for sonner error styling if default isn't dark
        // type: 'error' // Uncomment if needed
      });
      // Alternatively, use toast.error if the default error style is preferred
      // toast.error(error instanceof Error ? error.message : "Failed to generate CodeBeast", { id: currentToastId });
    } finally {
      NProgress.done();
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (generatedData?.githubUrl) {
      const urlParts = generatedData.githubUrl.split('/');
      const extractedUsername = urlParts[urlParts.length - 1] || username; 
      
      shareOnTwitter(extractedUsername);
      toast.success("Twitter share dialog opened");
    } else {
      toast.error("Cannot share - missing required data (URL).");
    }
  };

  // Refine languageList creation to filter out specific placeholders
  const languageList = generatedData?.languages
    ?.split(",")
    .map(lang => lang.trim())
    .filter(Boolean) // Remove empty strings
    .filter(lang => lang !== '[]' && !lang.startsWith('[None')) // Remove placeholders
    || [];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="glass border-0 bg-black/30 backdrop-blur-xl text-white">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <form className="space-y-4" onSubmit={handleGenerate}>
                <Input
                  type="text"
                  placeholder="Enter GitHub handle to generate your beast..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full bg-black/20 border-white/10 text-sm py-3 px-4 rounded-xl placeholder:text-gray-500"
                />
                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 text-base font-medium rounded-xl gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {loading ? "Generating..." : "Generate"}
                </Button>
              </form>

              {generatedData && (
                <div className="mt-6 animate-fade-in">
                  <RepositoryInfo 
                    repoCount={generatedData.repoCount ?? 0}
                    languages={languageList}
                    prompt={generatedData.prompt}
                    githubUrl={generatedData.githubUrl}
                    animalSelection={generatedData.animalSelection}
                  />
                </div>
              )}
            </div>

            {generatedData?.imageUrl && (
              <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-white/10">
                  <Image
                    src={generatedData.imageUrl}
                    alt="Generated CodeBeast"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-4 w-full">
                  <Button 
                    variant="outline"
                    onClick={handleShare}
                    className="flex-1 bg-black/20 border-white/10 text-white hover:bg-black/30 text-md font-medium rounded-xl"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                   <Button 
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = generatedData.imageUrl;
                      link.download = `codebeast-${username}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex-1 bg-black/20 border-white/10 text-white hover:bg-black/30 text-md font-medium rounded-xl"
                  >
                    Download Beast
                  </Button>
                </div>
              </div>
            )}
            {!generatedData && !loading && (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Enter a GitHub handle to generate your beast!
              </div>
            )}
             {loading && (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                Generating your beast...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 