'use client';

import { useState, useRef } from "react";
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
import { Sparkles, X } from "lucide-react";
import { RepositoryInfo } from "./github/RepositoryInfo";
import NProgress from 'nprogress';
import { GeneratedImage } from "./github/GeneratedImage";

// GitHub username validation regex
const GITHUB_USERNAME_REGEX = /^([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})$/;

// Function to generate prompt using our API - Modified to accept FormData
const generatePrompt = async (payload: { username: string, emotion: string } | FormData) => {
  const isFormData = payload instanceof FormData;
  const response = await fetch('/api/generate/prompt', {
    method: 'POST',
    headers: isFormData ? {} : { 'Content-Type': 'application/json' }, // Let browser set Content-Type for FormData
    body: isFormData ? payload : JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to generate prompt: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Define available emotions - Revised with more visual ones
const EMOTIONS = ["Action Figure", "Zen/Godlike", "Ecstatic", "Angry", "Surprised", "Legendary", "Exploding Head", "Crying", "Zombie", "Ghibli Scene in rolling meadows", "Caped Crusader"];

export default function CodeBeastGenerator() {
  const [username, setUsername] = useState("");
  const [isUsernameValid, setIsUsernameValid] = useState(true); // State for input validity
  const [selectedEmotion, setSelectedEmotion] = useState<string>(EMOTIONS[0]); // Add state for emotion, default to first
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // <-- Add state for file
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<{
    languages: string;
    prompt: string;
    githubUrl: string;
    imageUrl: string;
    repoCount?: number;
    animalSelection?: string[];
    source?: 'cache' | 'langflow';
    isImg2Img?: boolean; // Flag to indicate if img2img was used
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null); // <-- Add ref for file input

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

  // <-- Add handler for file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  // <-- Add handler to clear the file
  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset the file input
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

    try {
      let apiPayload: { username: string, emotion: string } | FormData;

      if (selectedFile) {
        // <-- Use FormData if file is selected
        const formData = new FormData();
        formData.append('username', trimmedUsername);
        formData.append('emotion', selectedEmotion);
        formData.append('imageFile', selectedFile);
        apiPayload = formData;
        console.log("Sending FormData with image");
      } else {
        // <-- Use JSON otherwise
        apiPayload = { username: trimmedUsername, emotion: selectedEmotion };
        console.log("Sending JSON");
      }

      // Call API with either FormData or JSON
      const data = await generatePrompt(apiPayload);
      
      // Step 1: Update toast based on source
      if (data.source === 'cache') {
        toast.message("Found User in DB", { 
          description: "Using saved details...",
          id: currentToastId 
        });
      } else if (data.source === 'langflow') { // source === 'langflow'
        toast.message("Generating Prompt with Langflow AI", { 
          description: "Fetching repository data...", 
          id: currentToastId 
        });
      } else {
         // Handle case where source isn't provided (e.g., direct img2img flow)
        toast.message("Preparing Generation Request", { description: "Processing inputs...", id: currentToastId });
      }
      
      // Step 2: Simulate brief delay and update toast for image generation
      await new Promise(resolve => setTimeout(resolve, 500)); // Short delay 
      const imageGenDescription = data.isImg2Img ? "Applying image style with EverArt AI" : "Generating Image with EverArt AI";
      toast.message(imageGenDescription, { 
        description: "Conjuring pixels... please wait.", 
        id: currentToastId 
      });

      // Step 3: Store data (image appears)
      setGeneratedData(data);

      // Step 4: Final success toast update (after a slight delay to let image render)
      await new Promise(resolve => setTimeout(resolve, 100)); // Short delay
      const successTitle = data.isImg2Img ? "Image Style Applied!" : "CodeBeast Generated!";
      toast.message(successTitle, { 
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
              <form className="space-y-4" onSubmit={handleGenerate}> {/* Increased space for file input */} 
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

                {/* <-- File Input Section --> */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Upload Your Headshot (Optional)</label>
                  {/* Hidden actual file input */}
                  <Input
                    id="imageUpload"
                    ref={fileInputRef} // <-- Assign ref
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleFileChange}
                    disabled={loading}
                    className="hidden"
                  />
                  {/* Visible Button wrapped in Label */}
                  <label htmlFor="imageUpload" className="w-full">
                    <Button
                      asChild
                      variant="outline"
                      disabled={loading}
                      className="w-full bg-black/20 border-white/10 text-gray-300 hover:bg-black/40 hover:text-white cursor-pointer"
                    >
                       <span>Choose Image</span>
                    </Button>
                  </label>
                  {/* Display selected file name and Clear button */}
                  {selectedFile && (
                    <div className="flex items-center justify-between mt-1"> {/* Container for name and button */} 
                      <p className="text-xs text-gray-400 truncate flex-1 mr-2">Selected: {selectedFile.name}</p>
                      <Button
                        type="button" // Prevent form submission
                        variant="ghost"
                        size="icon"
                        onClick={handleClearFile}
                        disabled={loading}
                        className="h-6 w-6 text-gray-500 hover:text-red-500 disabled:opacity-50"
                        aria-label="Clear selected image"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

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
                  {/* Conditionally render RepositoryInfo only if it wasn't an img2img generation */}
                  {!generatedData.isImg2Img && (
                    <RepositoryInfo 
                      repoCount={generatedData.repoCount ?? 0}
                      languages={languageList}
                      prompt={generatedData.prompt}
                      githubUrl={generatedData.githubUrl}
                      // Pass the raw data
                      animalSelection={generatedData.animalSelection}
                    />
                  )}
                  {generatedData.isImg2Img && (
                    <p className="text-sm text-gray-400 italic">Generated using uploaded image and '{selectedEmotion}' style.</p>
                  )}
                </div>
              )}
            </div>

            {generatedData?.imageUrl && (
              <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
                <GeneratedImage 
                  imageUrl={generatedData.imageUrl} 
                  handle={username}
                />
              </div>
            )}
            {!generatedData && !loading && (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Enter a GitHub handle and optionally upload an image to generate your beast!
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