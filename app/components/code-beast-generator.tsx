'use client';

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Image from "next/image";
import { Sparkles } from "lucide-react";

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

export default function CodeBeastGenerator() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<{
    languages: string;
    prompt: string;
    githubUrl: string;
    imageUrl: string;
  } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedData(null);

    try {
      if (!username.trim()) {
        toast.error("Please enter a GitHub username");
        return;
      }

      const data = await generatePrompt(username);
      
      setGeneratedData(data);
      toast.success("Successfully generated your CodeBeast!");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate CodeBeast");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="glass border-0 bg-black/30 backdrop-blur-xl text-white">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <form onSubmit={onSubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter GitHub handle to generate your beast..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full bg-black/20 border-white/10 text-lg py-6 px-4 rounded-xl placeholder:text-gray-500"
                />
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white py-6 text-lg font-medium rounded-xl gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {loading ? "Generating..." : "Generate"}
                </Button>
              </form>

              {generatedData && (
                <div className="space-y-4 text-gray-400 animate-fade-in mt-4">
                  <div className="space-y-1">
                    <h3 className="text-md font-medium text-white">GitHub Profile</h3>
                    <a 
                      href={generatedData.githubUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 transition-colors text-sm break-all"
                    >
                      {generatedData.githubUrl}
                    </a>
                  </div>
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
                    onClick={() => window.open(generatedData.imageUrl, '_blank')}
                    className="flex-1 bg-black/20 border-white/10 text-white hover:bg-black/30 text-md font-medium rounded-xl"
                  >
                    View Full Size
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