
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, RefreshCw, Sparkles, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface CodeBeast {
  username: string;
  imageUrl: string;
}

const Gallery = () => {
  const { toast } = useToast();
  const previousBeasts = useRef<Map<string, string>>(new Map());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCodeBeasts = async (): Promise<CodeBeast[]> => {
    console.log('Fetching CodeBeasts...');
    const response = await fetch(`${API_BASE_URL}/api/static/temp`);
    if (!response.ok) {
      throw new Error('Failed to fetch CodeBeasts');
    }
    const data = await response.json();
    console.log('Fetched CodeBeasts:', data);
    return data;
  };

  const { data: codeBeasts = [], refetch } = useQuery({
    queryKey: ['codebeasts'],
    queryFn: fetchCodeBeasts,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  useEffect(() => {
    if (codeBeasts.length > 0) {
      const newOrUpdatedBeasts = codeBeasts.filter(beast => {
        const previousImageUrl = previousBeasts.current.get(beast.username);
        return !previousImageUrl || previousImageUrl !== beast.imageUrl;
      });

      if (newOrUpdatedBeasts.length > 0) {
        console.log('New or updated CodeBeasts detected:', newOrUpdatedBeasts);
        
        // Separate new and updated beasts
        const newBeasts = newOrUpdatedBeasts.filter(beast => !previousBeasts.current.has(beast.username));
        const updatedBeasts = newOrUpdatedBeasts.filter(beast => previousBeasts.current.has(beast.username));
        
        // Show different toast messages for new vs updated beasts
        if (newBeasts.length > 0) {
          const usernames = newBeasts.map(beast => beast.username);
          toast({
            title: "New CodeBeast" + (usernames.length > 1 ? "s" : "") + " Generated!",
            description: `Welcome ${usernames.join(", ")} to the gallery!`,
            duration: 5000,
          });
        }
        
        if (updatedBeasts.length > 0) {
          const usernames = updatedBeasts.map(beast => beast.username);
          toast({
            title: "CodeBeast" + (usernames.length > 1 ? "s" : "") + " Updated!",
            description: `${usernames.join(", ")} generated new images!`,
            duration: 5000,
          });
        }
      }

      // Update the previous beasts map
      const newBeastsMap = new Map(codeBeasts.map(beast => [beast.username, beast.imageUrl]));
      previousBeasts.current = newBeastsMap;
    }
  }, [codeBeasts, toast]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

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
            <div key={beast.username} className="group relative aspect-[1/1.4]">
              <Card className="h-full overflow-hidden bg-black/20 border-white/10 hover:border-white/20 transition-colors">
                <CardContent className="h-full p-2 flex flex-col">
                  <div className="relative flex-1">
                    <button
                      onClick={() => handleDownload(beast.imageUrl, beast.username)}
                      className="absolute top-2 right-2 p-1.5 bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-black/90 hidden md:block"
                      title="Download CodeBeast"
                    >
                      <Download className="w-4 h-4 text-white" />
                    </button>

                    <div className="aspect-square overflow-hidden rounded-lg">
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
                  </div>

                  <div className="mt-2 pb-1">
                    <p className="text-white/80 text-center text-sm font-medium truncate">@{beast.username}</p>
                    
                    <div className="flex justify-center gap-2 mt-2 md:hidden">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => handleDownload(beast.imageUrl, beast.username)}
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
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <a 
                href={`https://github.com/${beast.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 hidden md:block hover:scale-105 transition-transform"
              />
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
