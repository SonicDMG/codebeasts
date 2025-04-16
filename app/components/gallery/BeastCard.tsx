'use client';

import React, { useRef } from 'react';
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Download, Share2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { BeastActions } from "./BeastActions";

interface BeastCardProps {
  beast: {
    username: string;
    image_url: string;
  };
  showActions?: boolean;
}

export function BeastCard({ beast, showActions = false }: BeastCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const topImageRef = useRef<HTMLImageElement>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);

  // Combined handlers for tilt and brightness/glow pulse (NO translateZ)
  const handleMouseEnter = () => {
    if (topImageRef.current) {
      topImageRef.current.style.opacity = '1';
      // Apply brightness/glow and tilt animations
      topImageRef.current.style.animation = 
        `pulse-brightness 2s ease-in-out infinite, 
         auto-tilt 2s ease-in-out infinite`;
      // Set base transform for animation start
      topImageRef.current.style.transform = 'perspective(1000px) rotateY(0deg) scale(1.1)'; 
    }
    if (imageRef.current) {
      // Apply only auto-tilt to bottom image
      imageRef.current.style.animation = 'auto-tilt 2s ease-in-out infinite';
      // Set base transform for animation start
      imageRef.current.style.transform = 'perspective(1000px) rotateY(0deg) scale(1.1)'; 
    }
    // Show scan lines
    if (scanLineRef.current) {
      scanLineRef.current.style.opacity = '1';
    }
  };

  const handleMouseLeave = () => {
    const resetTransform = 'perspective(1000px) rotateY(0deg) scale(1.1)'; // Reset rotation and scale
    const resetTransition = 'transform 0.3s ease-out, opacity 0.3s ease-in-out, filter 0.3s ease-out';

    // Reset effects on top image
    if (topImageRef.current) {
      topImageRef.current.style.opacity = '0';
      topImageRef.current.style.animation = 'none'; 
      topImageRef.current.style.filter = 'brightness(1.0) drop-shadow(0 0 0px transparent)';
      topImageRef.current.style.transform = resetTransform; 
      topImageRef.current.style.transition = resetTransition;
    }
    // Reset effects on bottom image
    if (imageRef.current) {
      imageRef.current.style.animation = 'none'; 
      imageRef.current.style.transform = resetTransform;
      imageRef.current.style.transition = 'transform 0.3s ease-out'; 
    }
    // Hide scan lines
    if (scanLineRef.current) {
      scanLineRef.current.style.opacity = '0';
    }
  };

  return (
    <Card className="beast-card-root overflow-hidden bg-[#0D1117] border-[#30363D]"
          style={{ transition: 'box-shadow 0.3s ease-in-out' }}
    >
      <CardContent
        ref={containerRef}
        className="p-0"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="aspect-square relative overflow-hidden">
          <Image
            ref={imageRef}
            src={beast.image_url}
            alt={`CodeBeast for ${beast.username}`}
            fill
            className="object-cover"
            style={{ 
              pointerEvents: 'none', 
              transform: 'perspective(1000px) rotateY(0deg) scale(1.1)' // Full initial state
            }} 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
          />
          <Image
            ref={topImageRef}
            src={beast.image_url}
            alt=""
            fill
            className="object-cover"
            style={{ 
              position: 'absolute', 
              inset: 0,
              pointerEvents: 'none', 
              transform: 'perspective(1000px) rotateY(0deg) scale(1.1)', // Full initial state
              opacity: 0,
              maskImage: 'radial-gradient(ellipse 50% 60% at center, black 20%, transparent 50%)',
              WebkitMaskImage: 'radial-gradient(ellipse 50% 60% at center, black 20%, transparent 50%)',
              filter: 'brightness(1.0) drop-shadow(0 0 0px transparent)',
              transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-out, filter 0.3s ease-out' // Keep transitions
            }} 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            aria-hidden="true"
          />
          <div ref={scanLineRef} className="scan-line-overlay" />
          <a
            href="https://langflow.new/ui/f/codebeasts"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 text-white text-sm font-semibold hover:underline focus:underline"
            style={{
              textShadow: '1px 1px 2px black',
              backgroundColor: 'rgba(0,0,0,0.3)',
              padding: '4px 8px',
              borderRadius: '4px',
              pointerEvents: 'auto',
              zIndex: 10
            }}
            aria-label="Learn more about Langflow"
          >
            Generated with Langflow
          </a>
        </div>

        {showActions && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <a 
                 href={`https://github.com/${beast.username}`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="text-[#7d8590] hover:text-blue-400 transition-colors font-medium flex items-center gap-2"
               >
                 <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor">
                   <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                 </svg>
                 {beast.username}
              </a>
            </div>
            <BeastActions imageUrl={beast.image_url} username={beast.username} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}