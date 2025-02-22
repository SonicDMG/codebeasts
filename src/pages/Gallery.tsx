
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { toast } from '@/components/ui/use-toast';

interface CodeBeast {
  username: string;
  imageUrl: string;
}

const Gallery = () => {
  const [codeBeasts, setCodeBeasts] = useState<CodeBeast[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/static/temp`)
      .then(response => response.json())
      .then(data => {
        setCodeBeasts(data);
      })
      .catch(() => {
        // Fallback data in case the API isn't available
        const fallbackData: CodeBeast[] = [
          { username: 'example-user', imageUrl: '/static/temp/generated_example-user.png' },
        ];
        setCodeBeasts(fallbackData);
      });
  }, []);

  const handleDownload = async (imageUrl: string, username: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${imageUrl}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `codebeast-${username}.png`;
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

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-white">CodeBeasts Gallery</h1>
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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-2">
          {codeBeasts.map((beast) => (
            <div key={beast.username} className="group relative block">
              <a 
                href={`https://github.com/${beast.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:scale-105 transition-transform"
              >
                <Card className="overflow-hidden bg-black/20 border-white/10 hover:border-white/20 transition-colors">
                  <CardContent className="p-1">
                    <div className="aspect-square overflow-hidden rounded-lg mb-1">
                      <img
                        src={`${API_BASE_URL}${beast.imageUrl}`}
                        alt={`CodeBeast for ${beast.username}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <p className="text-white/80 text-xs font-medium truncate">@{beast.username}</p>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDownload(beast.imageUrl, beast.username);
                        }}
                        className="text-white/60 hover:text-white/90 transition-colors"
                        title="Download CodeBeast"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </div>
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
