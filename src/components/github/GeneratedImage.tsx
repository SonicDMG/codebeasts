
import { Button } from '@/components/ui/button';
import { Download, Share2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface GeneratedImageProps {
  imageUrl: string;
  handle: string;
  onDownload: () => void;
  onShare: () => void;
}

export const GeneratedImage = ({ imageUrl, handle, onDownload, onShare }: GeneratedImageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image
      ctx.drawImage(img, 0, 0);

      // Configure text style
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 4;
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';

      const text = `Generated for @${handle}`;

      // Position text at bottom center
      const x = canvas.width / 2;
      const y = canvas.height - 30;

      // Draw text with stroke for better visibility
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    };
  }, [imageUrl, handle]);

  return (
    <div className="lg:w-[600px] space-y-4 animate-fade-in">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg">
        <canvas
          ref={canvasRef}
          className="object-cover w-full h-full"
        />
      </div>

      <div className="flex gap-4 justify-center">
        <Button variant="secondary" className="glass" onClick={onDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button variant="secondary" className="glass" onClick={onShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  );
};
