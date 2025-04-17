import React from 'react';
import { BeastCard } from '../gallery/BeastCard';

interface GeneratedImageProps {
  imageUrl: string;
  handle: string;
  className?: string;
}

export const GeneratedImage = ({ imageUrl, handle, className = '' }: GeneratedImageProps) => {
  return (
    <div className={`w-full pb-6 ${className}`}>
      <BeastCard 
        beast={{ username: handle, image_url: imageUrl }}
        showActions={true} 
      />
    </div>
  );
};
