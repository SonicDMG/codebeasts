
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { HandleInput } from '@/components/github/HandleInput';
import { RepositoryInfo } from '@/components/github/RepositoryInfo';
import { GeneratedImage } from '@/components/github/GeneratedImage';
import { ModelSelector } from '@/components/github/ModelSelector';
import { API_BASE_URL } from '@/config/api';
import type { ProcessResponse, GenerateImageResponse } from '@/types/github';

// Configure NProgress globally
NProgress.configure({ 
  showSpinner: false,
  trickle: true,
  trickleSpeed: 1500,
  minimum: 0.08,
  barSelector: '[role="bar"]',
});

const Index = () => {
  const [handle, setHandle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [repoCount, setRepoCount] = useState<number>(0);
  const [githubUrl, setGithubUrl] = useState('');
  const [animalSelection, setAnimalSelection] = useState<[string, string][]>([]);
  const [isFading, setIsFading] = useState(false);
  const [model, setModel] = useState('stability');
  const { toast } = useToast();

  const resetState = () => {
    setGeneratedImage('');
    setLanguages([]);
    setGeneratedPrompt('');
    setRepoCount(0);
    setGithubUrl('');
    setAnimalSelection([]);
    setIsFading(false);
  };

  const updateLoadingStatus = (status: string, progress: number) => {
    NProgress.set(progress);
    toast({
      title: status,
      description: "Please wait while we process your request...",
    });
  };

  const handleGenerate = async () => {
    if (!handle) {
      toast({
        title: "Please enter a GitHub handle",
        variant: "destructive",
      });
      return;
    }

    if (generatedImage) {
      setIsFading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      resetState();
    }

    setIsGenerating(true);
    NProgress.start();

    try {
      updateLoadingStatus(`Analyzing GitHub profile...`, 0.15);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateLoadingStatus('Collecting repository data...', 0.25);
      await new Promise(resolve => setTimeout(resolve, 400));

      const processResponse = await fetch(`${API_BASE_URL}/chat/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: handle }),
      });

      if (!processResponse.ok) {
        throw new Error('Processing failed');
      }

      const processData: ProcessResponse = await processResponse.json();
      
      if (processData.status === 'error') {
        throw new Error(processData.error || 'Processing failed');
      }

      updateLoadingStatus('Pulling coding information from repos...', 0.3);
      await new Promise(resolve => setTimeout(resolve, 400));

      updateLoadingStatus('Generating AI response...', 0.4);

      setLanguages(processData.languages);
      setGeneratedPrompt(processData.response);
      setRepoCount(processData.num_repositories);
      setGithubUrl(processData.github_url);
      setAnimalSelection(processData.animal_selection);
      
      await new Promise(resolve => setTimeout(resolve, 800));

      updateLoadingStatus(`Creating your CodeBeast with ${model === 'dall_e' ? 'DALL-E' : 'Stability'} API...`, 0.65);
      const generateResponse = await fetch(`${API_BASE_URL}/chat/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: processData.response,
          model: model,
          handle: handle
        }),
      });

      if (!generateResponse.ok) {
        throw new Error('Image generation failed');
      }

      const generateData: GenerateImageResponse = await generateResponse.json();
      
      if (generateData.status === 'error') {
        throw new Error(generateData.error || 'Image generation failed');
      }

      updateLoadingStatus('Generating your CodeBeast...', 0.75);
      
      // Create a promise that resolves when the image is loaded
      const imageLoadPromise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = `${API_BASE_URL}/${generateData.image_url}`;
      });

      // Wait for the image to load
      await imageLoadPromise;
      
      updateLoadingStatus('Finalizing your CodeBeast...', 0.9);
      
      // Set the image URL only after it's loaded
      setGeneratedImage(`${API_BASE_URL}/${generateData.image_url}`);
      
      NProgress.done();
      toast({
        title: "CodeBeast generation complete!",
        description: "Your unique beast has been created.",
      });
    } catch (error) {
      NProgress.done();
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
      resetState();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isGenerating) {
      handleGenerate();
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codebeast-${handle}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: "Your CodeBeast image is being downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error downloading your image.",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    // Download the image first
    handleDownload();
    
    const text = `Check out my unique CodeBeast! 🎮✨ Generated using my GitHub profile stats powered by @langflow_ai!\n\nGenerate your own: https://codebeast.lovable.dev 🚀\n\n#AIart #AgenticAI #AI #CodeArt`;
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    
    toast({
      title: "Image Downloaded",
      description: "Your CodeBeast has been downloaded. Please attach it to your tweet for the best sharing experience!",
    });
  };

  return (
    <div className="min-h-screen flex flex-col px-4 relative">
      <div className="flex flex-col pt-8 md:pt-2">
        <div className="flex justify-between items-center">
          <a 
            href="https://langflow.org" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            powered by Langflow
          </a>
          <Link
            to="/gallery"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            View Gallery
          </Link>
        </div>

        <div className="text-center space-y-2 mt-4 md:mt-0 mb-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-fade-in">
            Transform Your Code Into a Beast! 🐉
          </h1>
          <p className="text-lg text-muted-foreground">
            Turn your GitHub profile into a unique AI-generated creature that reflects your coding prowess
          </p>
        </div>

        <div className="w-full flex justify-center py-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <img 
              src="/lovable-uploads/6e48cfe8-7c75-4565-939d-f665321ddd3a.png" 
              alt="CodeBeasts"
              className="relative w-[300px] h-auto drop-shadow-[0_0_15px_rgba(155,135,245,0.3)] transition-all duration-300 group-hover:scale-105"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <Card className="glass w-full max-w-4xl p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <HandleInput
                  handle={handle}
                  isGenerating={isGenerating}
                  onHandleChange={setHandle}
                  onGenerate={handleGenerate}
                  onKeyPress={handleKeyPress}
                />
                
                <ModelSelector
                  model={model}
                  onModelChange={setModel}
                  disabled={isGenerating}
                />
                
                <RepositoryInfo
                  repoCount={repoCount}
                  languages={languages}
                  prompt={generatedPrompt}
                  githubUrl={githubUrl}
                  animalSelection={animalSelection}
                />
              </div>

              {generatedImage && (
                <GeneratedImage
                  imageUrl={generatedImage}
                  handle={handle}
                  onDownload={() => {
                    toast({
                      title: "Download started",
                      description: "Your CodeBeast image is being downloaded.",
                    });
                  }}
                  onShare={handleShare}
                  className={isFading ? 'animate-fade-out' : 'animate-fade-in'}
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
