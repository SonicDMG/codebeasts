
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { HandleInput } from '@/components/github/HandleInput';
import { RepositoryInfo } from '@/components/github/RepositoryInfo';
import { GeneratedImage } from '@/components/github/GeneratedImage';
import { ModelSelector } from '@/components/github/ModelSelector';
import { Header } from '@/components/layout/Header';
import { Hero } from '@/components/layout/Hero';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { downloadImage, shareOnTwitter } from '@/utils/imageActions';

NProgress.configure({ 
  showSpinner: false,
  trickle: true,
  trickleSpeed: 1500,
  minimum: 0.08,
  barSelector: '[role="bar"]',
});

const Index = () => {
  const [handle, setHandle] = useState('');
  const [model, setModel] = useState('stability');
  const { toast } = useToast();
  
  const {
    isGenerating,
    generatedImage,
    languages,
    generatedPrompt,
    repoCount,
    githubUrl,
    animalSelection,
    isFading,
    generateImage,
  } = useImageGeneration();

  const handleGenerate = () => {
    generateImage(handle, model);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isGenerating) {
      handleGenerate();
    }
  };

  const handleDownload = () => {
    downloadImage(generatedImage, handle, toast);
  };

  const handleShare = () => {
    shareOnTwitter(generatedImage);
  };

  return (
    <div className="min-h-screen flex flex-col px-4 relative">
      <div className="flex flex-col pt-8 md:pt-2">
        <Header />
        <Hero />

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
                  onDownload={handleDownload}
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
