import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

// Configure NProgress
NProgress.configure({ 
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.08
});

type GeneratedData = {
  languages: string[] | string;
  prompt: string;
  githubUrl: string;
  imageUrl?: string;
  status?: {
    langflow: 'success' | 'error' | 'not_started';
    everart: 'success' | 'error' | 'not_started';
  };
};

export function CodeBeastGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const username = form.username.value;

    if (!username) return;

    setIsLoading(true);
    NProgress.start();
    NProgress.set(0.2);

    try {
      const loadingToast = toast.loading("Starting CodeBeast generation...");
      
      const response = await fetch("/api/generate/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      NProgress.set(0.4);
      
      if (!response.ok) {
        throw new Error("Failed to generate");
      }

      const data = await response.json();
      NProgress.set(0.6);
      toast.dismiss(loadingToast);
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Save to gallery if we have an image
      if (data.imageUrl) {
        const galleryResponse = await fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username,
            image_url: data.imageUrl,
          }),
        });

        if (!galleryResponse.ok) {
          const errorData = await galleryResponse.json();
          toast.error(errorData.error || "Failed to save to gallery");
        }
      }

      NProgress.set(0.8);
      setGeneratedData(data);
      toast.success("CodeBeast generated successfully!");
      NProgress.done();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate CodeBeast");
      NProgress.done();
    } finally {
      setIsLoading(false);
    }
  };

  // Parse languages, handling both string and array formats
  const languageList = Array.isArray(generatedData?.languages) 
    ? generatedData.languages 
    : generatedData?.languages?.replace(/[\[\]']/g, '').split(',').map(lang => lang.trim()) || [];
  
  const repoCount = languageList.length > 0 ? `${languageList.length * 10} public repositories` : '';

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-300"
          >
            GitHub Username
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              name="username"
              id="username"
              required
              className="block w-full rounded-md border-gray-600 bg-gray-800 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter your GitHub username"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? "Generating..." : "Generate CodeBeast"}
        </button>
      </form>

      {generatedData && (
        <div className="space-y-6 bg-[#0D1117] rounded-xl p-8">
          {repoCount && generatedData.githubUrl && (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#7d8590]" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/>
              </svg>
              <a 
                href={generatedData.githubUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-lg font-medium text-[#7d8590] hover:text-blue-400 transition-colors"
              >
                {repoCount}
              </a>
            </div>
          )}

          {languageList.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {languageList.map((language, index) => (
                <span
                  key={index}
                  className="px-3 py-[3px] rounded-full text-[13px] font-medium bg-[#0D1117] text-[#7d8590] border border-[#30363D] hover:border-[#7d8590] transition-colors cursor-pointer"
                >
                  {language}
                </span>
              ))}
            </div>
          )}

          {generatedData.imageUrl && (
            <div className="space-y-4">
              <div className="relative w-full aspect-square max-w-2xl mx-auto">
                <Image
                  src={generatedData.imageUrl}
                  alt="Generated CodeBeast"
                  fill
                  className="rounded-xl object-cover border border-[#30363D]"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 