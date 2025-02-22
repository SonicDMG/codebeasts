
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
    console.log('Gallery: Starting to fetch CodeBeasts from:', `${API_BASE_URL}/api/static/temp`);
    
    fetch(`${API_BASE_URL}/api/static/temp`)
      .then(response => {
        console.log('Gallery: Received response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
        return response.json();
      })
      .then(data => {
        console.log('Gallery: Parsed response data:', data);
        setCodeBeasts(data);
      })
      .catch((error) => {
        console.error('Gallery: Error fetching CodeBeasts:', error);
        // Fallback data in case the API isn't available
        const fallbackData: CodeBeast[] = [
          { username: 'example-user', imageUrl: '/static/temp/generated_example-user.png' },
        ];
        console.log('Gallery: Using fallback data:', fallbackData);
        setCodeBeasts(fallbackData);
      });
  }, []);

  console.log('Gallery: Current codeBeasts state:', codeBeasts);

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

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-2">
        {codeBeasts.map((beast) => {
          console.log('Gallery: Rendering beast:', beast);
          return (
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
                        console.error('Gallery: Image failed to load:', target.src);
                        target.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <p className="text-white/80 text-center text-xs font-medium truncate">@{beast.username}</p>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>

      {codeBeasts.length === 0 && (
        <div className="text-center text-white/60 py-12">
          <p className="text-lg">No CodeBeasts have been generated yet.</p>
          <Link to="/" className="text-primary hover:text-primary/80 mt-4 inline-block">
            Generate your CodeBeast
          </Link>
        </div>
      )}
    </div>
  );
};

export default Gallery;
