'use client';

import * as React from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ImageRecord } from "@/app/lib/db/astra";

const ITEMS_PER_PAGE = 20;

async function fetchGalleryImages() {
  const response = await fetch("/api/gallery");
  if (!response.ok) {
    throw new Error("Failed to fetch gallery images");
  }
  return response.json();
}

export function Gallery() {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState("");
  const { data: images = [], isLoading, error } = useQuery<ImageRecord[]>({
    queryKey: ["gallery"],
    queryFn: fetchGalleryImages,
  });
  const router = useRouter();

  // Sort images by username (case-insensitive)
  const sortedImages = React.useMemo(() =>
    [...images].sort((a, b) => a.username.localeCompare(b.username, undefined, { sensitivity: 'base' })),
    [images]
  );

  // Filter images by search query (case-insensitive)
  const filteredImages = React.useMemo(() =>
    sortedImages.filter(img => img.username.toLowerCase().includes(searchQuery.toLowerCase())),
    [sortedImages, searchQuery]
  );

  const totalPages = Math.ceil(filteredImages.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentImages = filteredImages.slice(startIndex, endIndex);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  // Reset to first page when search query changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (isLoading) {
    return (
      <div className="grid gap-6 grid-cols-3 sm:grid-cols-4 md:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-16 bg-muted rounded-t-lg" />
            <CardContent className="aspect-square bg-muted rounded-b-lg" />
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

  const handleCardClick = (username: string) => {
    router.push(`/?u=${username}`);
  };

  return (
    <>
      <div className="flex justify-center mb-6">
        <input
          type="text"
          className="w-full max-w-xs px-3 py-2 border border-gray-600 rounded-md bg-[#161B22] text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by username..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 mb-8">
        {currentImages.map((image: ImageRecord) => (
          <div
            key={image._id}
            className="block hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-lg"
            onClick={() => handleCardClick(image.username)}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(image.username); }}
          >
            <Card className="overflow-hidden bg-[#0D1117] border-[#30363D] h-full flex flex-col">
              <CardHeader className="p-2 space-y-1">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#7d8590]" viewBox="0 0 16 16" fill="currentColor">
                    <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                  </svg>
                  <a
                    href={`https://github.com/${image.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#7d8590] hover:text-blue-400 transition-colors font-medium truncate"
                    onClick={(e) => e.stopPropagation()}
                    title={image.username}
                  >
                    {image.username}
                  </a>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-grow">
                <div className="aspect-square relative bg-muted h-full w-full">
                  {image.image_url.startsWith('https://storage.googleapis.com') || image.image_url.startsWith('/images/') ? (
                    <Image
                      src={image.image_url}
                      alt={`CodeBeast for ${image.username}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                      priority={startIndex < ITEMS_PER_PAGE}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-gray-800">
                      <svg className="w-10 h-10 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2z" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-8 mb-4">
          <Button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            variant="outline"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
} 