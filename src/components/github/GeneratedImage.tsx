
import { Button } from '@/components/ui/button';
import { Download, Share2 } from 'lucide-react';

interface GeneratedImageProps {
  imageUrl: string;
  onDownload: () => void;
  onShare: () => void;
}

export const GeneratedImage = ({ imageUrl, onDownload, onShare }: GeneratedImageProps) => {
  return (
    <div className="lg:w-[600px] space-y-4 animate-fade-in">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg">
        <img
          src={imageUrl}
          alt="Generated CodeBeast"
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
