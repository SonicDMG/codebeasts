
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Download, Share2 } from 'lucide-react';

const Index = () => {
  const [handle, setHandle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState('');
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!handle) {
      toast({
        title: "Please enter a GitHub handle",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Replace this URL with your Python backend endpoint
      const response = await fetch('http://localhost:5000/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ github_handle: handle }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      // Assuming your backend returns an image URL or base64 string
      setGeneratedImage(data.image_url);
      
      toast({
        title: "CodeBeast generation complete!",
        description: "Your unique beast has been created.",
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-12 px-4 space-y-8">
      <div className="floating">
        <img 
          src="https://your-codebeast-logo.png" 
          alt="CodeBeasts"
          className="w-64 h-auto mb-8"
        />
      </div>

      <Card className="glass w-full max-w-xl p-6 space-y-6">
        <div className="space-y-4">
          <Input
            placeholder="Enter GitHub handle to generate your beast..."
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="bg-black/40 border-white/20 text-white placeholder:text-white/50"
          />
          
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
          >
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
        </div>

        {generatedImage && (
          <div className="space-y-4 animate-fade-in">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <img
                src={generatedImage}
                alt="Generated CodeBeast"
                className="object-cover w-full h-full"
              />
            </div>

            <div className="flex gap-4 justify-center">
              <Button variant="secondary" className="glass">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button variant="secondary" className="glass">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-2 justify-center text-sm text-white/60">
        {['JavaScript', 'Java', 'HTML', 'Shell', 'Python', 'Astro', 'Nunjucks'].map((tech) => (
          <span key={tech} className="px-3 py-1 rounded-full glass">
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Index;
