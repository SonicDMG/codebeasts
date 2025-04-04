import { Metadata } from "next";
import { Gallery } from "@/components/gallery";

export const metadata: Metadata = {
  title: "Gallery - CodeBeasts",
  description: "View AI-generated images from the community",
};

export default function GalleryPage() {
  return (
    <main className="container mx-auto p-4">
      <div className="flex flex-col items-center justify-center py-8">
        <h1 className="text-4xl font-bold text-center mb-2">Gallery</h1>
        <p className="text-muted-foreground text-center mb-8">
          View AI-generated images from the community
        </p>
      </div>
      <Gallery />
    </main>
  );
} 