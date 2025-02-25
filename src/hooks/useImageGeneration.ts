
/**
 * Custom hook that manages the image generation process for CodeBeasts.
 * Handles API calls, loading states, and user feedback for the GitHub profile analysis
 * and subsequent AI image generation. Includes progress tracking and error handling.
 */

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import NProgress from 'nprogress';
import { API_BASE_URL } from '@/config/api';
import type { ProcessResponse, GenerateImageResponse } from '@/types/github';

export const useImageGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [repoCount, setRepoCount] = useState<number>(0);
  const [githubUrl, setGithubUrl] = useState('');
  const [animalSelection, setAnimalSelection] = useState<[string, string][]>([]);
  const [isFading, setIsFading] = useState(false);
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

  const generateImage = async (handle: string, model: string) => {
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
      
      const imageLoadPromise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = `${API_BASE_URL}/${generateData.image_url}`;
      });

      await imageLoadPromise;
      
      updateLoadingStatus('Finalizing your CodeBeast...', 0.9);
      
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

  return {
    isGenerating,
    generatedImage,
    languages,
    generatedPrompt,
    repoCount,
    githubUrl,
    animalSelection,
    isFading,
    generateImage,
  };
};
