
/**
 * Component for displaying a single CodeBeast image directly via URL parameters.
 * Supports both URL query parameters and route parameters for image lookup.
 * Includes fallback states for missing images and error handling.
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { API_BASE_URL } from '@/config/api';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Download, Share2 } from 'lucide-react';
import { downloadImage, shareOnTwitter } from '@/utils/imageActions';
import { useToast } from '@/hooks/use-toast';

const DirectImage = () => {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Check both URL formats
  const handle = searchParams.get('u') || params.username;

  useEffect(() => {
    if (handle) {
      const timestamp = Date.now();
      const originalCaseImagePath = `${API_BASE_URL}/static/temp/generated_${handle}.png?t=${timestamp}`;
      
      fetch(originalCaseImagePath)
        .then(response => {
          if (response.ok) {
            setImageUrl(originalCaseImagePath);
          } else {
            const lowercaseImagePath = `${API_BASE_URL}/static/temp/generated_${handle.toLowerCase()}.png?t=${timestamp}`;
            return fetch(lowercaseImagePath);
          }
        })
        .then(response => {
          if (response?.ok) {
            setImageUrl(`${API_BASE_URL}/static/temp/generated_${handle.toLowerCase()}.png?t=${timestamp}`);
          } else {
            console.error('Image not found in either case');
          }
        })
        .catch(error => {
          console.error('Error fetching image:', error);
        });
    }
  }, [handle]);

  const handleDownload = async () => {
    if (imageUrl && handle) {
      await downloadImage(imageUrl, handle, toast);
    }
  };

  const handleShare = () => {
    if (imageUrl && handle) {
      shareOnTwitter(imageUrl, handle);
      toast({
        description: "Twitter share dialog opened",
      });
    }
  };

  if (!handle) {
    return (
      <div className="min-h-screen flex flex-col px-4 py-4">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-6">
            <h1 className="text-2xl font-bold text-center">No GitHub handle provided</h1>
            <p className="text-center mt-2">Please use the URL format: /direct/githubhandle</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-4 py-4">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        {imageUrl ? (
          <div className="max-w-2xl w-full">
            <Card className="p-6 space-y-4">
              <h1 className="text-2xl font-bold text-center break-words">CodeBeast for @{handle}</h1>
              <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                <img
                  src={imageUrl}
                  alt={`CodeBeast for ${handle}`}
                  className="object-contain w-full h-full"
                />
              </div>
              
              {/* Added action buttons */}
              <div className="flex gap-4 justify-center">
                <Button onClick={handleDownload} className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" onClick={handleShare} className="w-full sm:w-auto">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
              
              <div className="text-center">
                <a 
                  href="/"
                  className="text-primary hover:underline"
                >
                  Generate your own CodeBeast
                </a>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-6">
            <h1 className="text-2xl font-bold text-center break-words">No CodeBeast found for @{handle}</h1>
            <p className="text-center mt-2">
              <a 
                href="/"
                className="text-primary hover:underline"
              >
                Generate a CodeBeast
              </a>
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DirectImage;
