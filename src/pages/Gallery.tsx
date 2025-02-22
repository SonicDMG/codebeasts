
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {codeBeasts.map((beast) => (
          <Card key={beast.username} className="overflow-hidden bg-black/20 border-white/10 hover:border-white/20 transition-colors">
            <CardContent className="p-4">
              <div className="aspect-square overflow-hidden rounded-lg mb-4">
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
              <p className="text-white/80 text-center font-medium">@{beast.username}</p>
            </CardContent>
          </Card>
        ))}
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
