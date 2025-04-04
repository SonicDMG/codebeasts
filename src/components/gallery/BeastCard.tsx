
/**
 * Card component for displaying individual CodeBeasts in the gallery.
 * Features image display, download functionality, and links to GitHub profiles.
 * Includes hover effects and mobile-responsive design.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, ExternalLink, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { CodeBeast } from '@/types/gallery';
import { Link } from 'react-router-dom';

interface BeastCardProps {
  beast: CodeBeast;
  timestamp?: number;
  isNew?: boolean;
}

export const BeastCard = ({ beast, timestamp, isNew = false }: BeastCardProps) => {
  const { toast } = useToast();
  const [isLoaded, setIsLoaded] = useState(false);

  // Add animation when a new beast is added
  const [showNewAnimation, setShowNewAnimation] = useState(isNew);
  
  useEffect(() => {
    // Update animation state when isNew changes
    setShowNewAnimation(isNew);
    
    if (isNew) {
      // Reset animation after 5 seconds
      const timer = setTimeout(() => {
        setShowNewAnimation(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isNew, beast.username]);

  const getImageUrl = (url: string) => {
    const baseUrl = `${API_BASE_URL}${url}`;
    return timestamp ? `${baseUrl}?t=${timestamp}` : baseUrl;
  };

  const handleDownload = async (e: React.MouseEvent) => {
    // Prevent the click from propagating to the parent element (which would navigate)
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const response = await fetch(getImageUrl(beast.imageUrl));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `codebeast-${beast.username}.png`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast({
        description: "CodeBeast downloaded successfully!",
        duration: 2000,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to download CodeBeast.",
        duration: 2000,
      });
    }
  };

  const handleGitHubClick = (e: React.MouseEvent) => {
    // Prevent the click from propagating to the parent element (which would navigate to direct image)
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  // Enhanced visual treatment for new beasts
  const newBeastStyles = isNew 
    ? 'ring-2 ring-primary shadow-lg shadow-primary/30 transform-gpu scale-105 z-10' 
    : '';

  return (
    <Link
      to={`/direct/${beast.username}`}
      className={`group relative aspect-[1/1.4] block ${
        !isLoaded ? 'opacity-0' : 'animate-fade-in'
      } ${showNewAnimation ? 'animate-pulse' : ''}`}
    >
      <Card className={`h-full overflow-hidden transition-all duration-500 ${
        isNew ? 'bg-primary/10 border-primary/40' : 'bg-black/20 border-white/10'
      } hover:border-white/20 hover:shadow-md cursor-pointer ${newBeastStyles}`}>
        {isNew && (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-primary/90 rounded-full px-2 py-1 shadow-sm shadow-primary/30">
            <Sparkles className="w-3 h-3 text-primary-foreground" />
            <span className="text-xs text-white font-medium">New</span>
          </div>
        )}
        <CardContent className="h-full p-2 flex flex-col">
          <div className="relative flex-1">
            <button
              onClick={handleDownload}
              className="absolute top-2 right-2 p-1.5 bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-black/90 hidden md:block"
              title="Download CodeBeast"
            >
              <Download className="w-4 h-4 text-white" />
            </button>

            <div className="aspect-square overflow-hidden rounded-lg">
              <img
                src={getImageUrl(beast.imageUrl)}
                alt={`CodeBeast for ${beast.username}`}
                className={`w-full h-full object-cover transition-transform duration-300 ${isNew ? 'scale-105' : ''}`}
                onLoad={handleImageLoad}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
            </div>
          </div>

          <div className="mt-2 pb-1">
            <p className={`text-center text-sm font-medium truncate ${isNew ? 'text-primary font-semibold' : 'text-white/80'}`}>
              @{beast.username}
            </p>
            
            <div className="flex justify-center gap-2 mt-2 md:hidden">
              <Button
                variant="secondary"
                size="icon"
                onClick={handleDownload}
                className="glass h-8 w-8"
                title="Download CodeBeast"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="glass h-8 w-8"
                asChild
              >
                <a
                  href={`https://github.com/${beast.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View GitHub Profile"
                  onClick={handleGitHubClick}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
