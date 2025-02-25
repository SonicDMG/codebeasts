
/**
 * Gallery page component that displays a grid of generated CodeBeasts.
 * Features auto-refresh functionality, manual refresh option, and responsive layout.
 * Includes empty state handling and navigation back to generation page.
 */

import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import { BeastCard } from '@/components/gallery/BeastCard';
import { useGalleryData } from '@/hooks/useGalleryData';

const Gallery = () => {
  const { codeBeasts, isRefreshing, handleManualRefresh } = useGalleryData();

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-white">CodeBeasts Gallery</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="text-white/60 hover:text-white"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <p className="text-white/80 text-2xl font-medium">Don't have a CodeBeast yet?</p>
          <Link to="/">
            <Button 
              variant="outline" 
              className="bg-black/20 border-white/10 hover:border-white/20 hover:bg-black/30 text-white gap-2 text-lg font-semibold"
            >
              <Sparkles className="w-5 h-5" />
              Generate Your Own Now!
            </Button>
          </Link>
        </div>
      </div>

      {codeBeasts.length > 0 ? (
        <div className="grid gap-4 grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 auto-rows-fr">
          {codeBeasts.map((beast) => (
            <BeastCard key={beast.username} beast={beast} />
          ))}
        </div>
      ) : (
        <div className="text-center text-white/60 py-12">
          <p className="text-lg mb-4">No CodeBeasts have been generated yet.</p>
          <p className="text-sm mb-6">Be the first to create your unique AI-generated creature!</p>
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Generate Your CodeBeast
          </Link>
        </div>
      )}
    </div>
  );
};

export default Gallery;
