
import { Button } from '@/components/ui/button';
import { Download, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface GeneratedImageProps {
  imageUrl: string;
  handle: string;
  onDownload: () => void;
  onShare: () => void;
  className?: string;
}

export const GeneratedImage = ({ imageUrl, handle, onDownload, onShare, className = '' }: GeneratedImageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [initialHandle] = useState(handle);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 4;
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';

      const text = `Generated for @${initialHandle}`;
      const x = canvas.width / 2;
      const y = canvas.height - 30;

      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    };
  }, [imageUrl, initialHandle]);

  return (
    <div className={`space-y-4 w-full ${className}`}>
      <div className="relative w-full aspect-square overflow-hidden rounded-lg">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
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
