
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
  const [initialHandle] = useState(handle); // Store the initial handle when component mounts

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

      const text = `Generated for @${initialHandle}`; // Use the initial handle instead of the current one

      // Position text at bottom center
      const x = canvas.width / 2;
      const y = canvas.height - 30;

      // Draw text with stroke for better visibility
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    };
  }, [imageUrl, initialHandle]); // Only depend on imageUrl and initialHandle, not the current handle

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get the canvas data as a URL
    const dataUrl = canvas.toDataURL('image/png');
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.download = `codebeast-${initialHandle}.png`; // Use initialHandle for filename too
    link.href = dataUrl;
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`lg:w-[600px] space-y-6 pb-6 ${className}`}>
      <div className="relative aspect-square w-full overflow-hidden rounded-lg">
        <canvas
          ref={canvasRef}
          className="object-cover w-full h-full"
        />
      </div>

      <div className="flex gap-4 justify-center px-4">
        <Button variant="secondary" className="glass w-full sm:w-auto" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button variant="secondary" className="glass w-full sm:w-auto" onClick={onShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  );
};
