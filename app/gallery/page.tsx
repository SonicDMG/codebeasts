import { Metadata } from "next";
import { Gallery } from "@/app/components/gallery";

export const metadata: Metadata = {
  title: "Gallery - CodeBeasts",
  description: "View AI-generated images from the community",
};

export default function GalleryPage() {
  return (
    <main className="container mx-auto px-4 pt-8 w-full">
      <div className="flex flex-col items-center justify-center mb-4">
        <h1 className="text-3xl font-bold text-center mb-1">Gallery</h1>
        <p className="text-white/70 text-center mt-1">
          View AI-generated images from the community
        </p>
      </div>
      <Gallery />
    </main>
  );
} 