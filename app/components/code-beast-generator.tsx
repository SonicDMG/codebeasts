'use client';

import { useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { toast } from "sonner";
import Image from "next/image";
import { Sparkles, Share2 } from "lucide-react";
import { RepositoryInfo } from "./github/RepositoryInfo";
import NProgress from 'nprogress';
import { downloadImageClientSide, shareOnTwitterClientSide } from "@/app/lib/utils";
import { BeastActions } from "./gallery/BeastActions";

// GitHub username validation regex
const GITHUB_USERNAME_REGEX = /^([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})$/;

// Function to generate prompt using our API
const generatePrompt = async (username: string, emotion: string) => {
  const response = await fetch('/api/generate/prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, emotion }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to generate prompt: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Define available emotions - Revised with more visual ones
const EMOTIONS = ["Zen/Godlike", "Happy", "Angry", "Surprised", "Facepalm", "Exploding Head", "Crying", "Zombie", "Cyborg", "Caped Crusader"];

export default function CodeBeastGenerator() {
  const [username, setUsername] = useState("");
  const [isUsernameValid, setIsUsernameValid] = useState(true); // State for input validity
  const [selectedEmotion, setSelectedEmotion] = useState<string>(EMOTIONS[0]); // Add state for emotion, default to first
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<{
    languages: string;
    prompt: string;
    githubUrl: string;
    imageUrl: string;
    repoCount?: number;
    animalSelection?: any[][];
    source?: 'cache' | 'langflow'; // Include source if not already added
  } | null>(null);

  // Add state for toastId
  const [toastId, setToastId] = useState<string | number | undefined>(undefined);

  // Updated onChange handler for username input
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setUsername(newValue);
    // Validate on change, allow empty string
    if (newValue.trim() === "") {
      setIsUsernameValid(true); 
    } else {
      setIsUsernameValid(GITHUB_USERNAME_REGEX.test(newValue.trim()));
    }
  };

  const handleGenerate = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();

    const trimmedUsername = username.trim(); // Trim once

    // --- Pre-submit checks (redundant but safe) --- 
    if (!trimmedUsername) {
      toast.error("Please enter a GitHub username");
      setIsUsernameValid(false); // Also set state if submitted empty
      return;
    }
    if (!GITHUB_USERNAME_REGEX.test(trimmedUsername)) {
      toast.error("Invalid GitHub username format.");
      setIsUsernameValid(false); // Ensure state reflects error
      return;
    }
    // --- End pre-submit checks ---

    // Ensure validity state is true before proceeding (belt-and-suspenders)
    if (!isUsernameValid) return; 

    setLoading(true);
    setGeneratedData(null);
    NProgress.configure({ showSpinner: false });
    NProgress.start();
    const currentToastId = toast.message("Starting Generation...", { 
      description: "Please wait while we fetch data..."
    }); 
    setToastId(currentToastId); 

    try {
      const data = await generatePrompt(trimmedUsername, selectedEmotion);
      
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
      toast.message("Generation Failed", { 
        description: error instanceof Error ? error.message : "An unknown error occurred",
        id: currentToastId,
      });
    } finally {
      NProgress.done();
      setLoading(false);
    }
  };

  // --- Remove filtering logic for animalSelection --- 
  // const filteredAnimalSelection = generatedData?.animalSelection?.filter(entry => ... ) || [];

  // Refine languageList creation - Clean brackets within map
  const languageList = generatedData?.languages
    ?.split(",")
    // Trim whitespace AND remove leading/trailing brackets
    .map(lang => lang.trim().replace(/^\s*[\[\]]|[\[\]]\s*$/g, '').trim())
    .filter(Boolean) // Remove empty strings resulting from cleaning
    // Keep filter for [None... placeholders (filtering single/double brackets is now less critical here)
    .filter(lang => !lang.startsWith('[None')) 
    || [];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="glass border-0 bg-black/30 backdrop-blur-xl text-white">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <form className="space-y-1" onSubmit={handleGenerate}> {/* Reduced space for error message */} 
                <div> {/* Wrap input and error message */} 
                  <Input
                    type="text"
                    placeholder="Enter GitHub handle to generate your beast..."
                    value={username}
                    onChange={handleUsernameChange} // Use updated handler
                    disabled={loading}
                    // Apply conditional styling for invalid input
                    className={`w-full bg-black/20 border-white/10 text-sm py-3 px-4 rounded-xl placeholder:text-gray-500 \
                      ${!isUsernameValid && username.trim() !== '' ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-purple-500'}`}
                    aria-invalid={!isUsernameValid && username.trim() !== ''}
                    aria-describedby={!isUsernameValid && username.trim() !== '' ? "username-error" : undefined}
                  />
                  {/* Conditional error message */} 
                  {!isUsernameValid && username.trim() !== '' && (
                    <p id="username-error" className="text-xs text-red-500 mt-1">
                      Invalid format (1-39 chars, alphanumeric/hyphen, no leading/trailing/double hyphens).
                    </p>
                  )}
                </div>

                <Select 
                  value={selectedEmotion} 
                  onValueChange={setSelectedEmotion}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full bg-black/20 border-white/10 text-sm py-3 px-4 rounded-xl placeholder:text-gray-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select an emotion..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-white/10 text-white">
                    {EMOTIONS.map((emotion) => (
                      <SelectItem 
                        key={emotion} 
                        value={emotion}
                        className="hover:bg-purple-600/50 focus:bg-purple-600/50"
                      >
                        {emotion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  type="submit"
                  // Disable button if loading OR username is invalid (and not empty)
                  disabled={loading || (!isUsernameValid && username.trim() !== '') || !username.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 text-base font-medium rounded-xl gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    // Pass the raw data
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
                <BeastActions imageUrl={generatedData.imageUrl} username={username} />
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