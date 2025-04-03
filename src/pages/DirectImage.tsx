
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

const DirectImage = () => {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
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

  if (!handle) {
    return (
      <div className="min-h-screen flex flex-col p-4">
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
    <div className="min-h-screen flex flex-col p-4">
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
