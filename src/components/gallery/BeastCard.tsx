
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { useToast } from '@/hooks/use-toast';
import type { CodeBeast } from '@/types/gallery';

interface BeastCardProps {
  beast: CodeBeast;
}

export const BeastCard = ({ beast }: BeastCardProps) => {
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${beast.imageUrl}`);
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

  return (
    <div className="group relative aspect-[1/1.4]">
      <Card className="h-full overflow-hidden bg-black/20 border-white/10 hover:border-white/20 transition-colors">
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
  );
};
