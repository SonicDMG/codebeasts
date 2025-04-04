'use client';

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { ImageRecord } from "@/app/lib/db/astra";

async function fetchGalleryImages() {
  const response = await fetch("/api/gallery");
  if (!response.ok) {
    throw new Error("Failed to fetch gallery images");
  }
  return response.json();
}

export function Gallery() {
  const { data: images, isLoading, error } = useQuery<ImageRecord[]>({
    queryKey: ["gallery"],
    queryFn: fetchGalleryImages,
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-muted" />
            <CardContent className="aspect-square bg-muted" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive">
        Error loading gallery images
      </div>
    );
  }

  if (!images?.length) {
    return (
      <div className="text-center text-muted-foreground">
        No images in the gallery yet
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((image: ImageRecord) => (
        <Link 
          key={image._id} 
          href={`/direct/${image.username}`} 
          className="block hover:scale-105 transition-transform duration-200 ease-in-out"
        >
          <Card className="overflow-hidden bg-[#0D1117] border-[#30363D] h-full">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#7d8590]" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                <a 
                  href={`https://github.com/${image.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#7d8590] hover:text-blue-400 transition-colors font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  {image.username}
                </a>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="aspect-square relative bg-muted">
                {image.image_url.startsWith('https://storage.googleapis.com') ? (
                  <Image
                    src={image.image_url}
                    alt={`CodeBeast for ${image.username}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2z" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
} 