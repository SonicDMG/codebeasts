
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

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

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="mb-8 flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-4xl font-bold text-white">CodeBeasts Gallery</h1>
      </div>

      {codeBeasts.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-2">
          {codeBeasts.map((beast) => (
            <a 
              href={`https://github.com/${beast.username}`}
              target="_blank"
              rel="noopener noreferrer"
              key={beast.username}
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
                  <p className="text-white/80 text-center text-xs font-medium truncate">@{beast.username}</p>
                </CardContent>
              </Card>
            </a>
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
