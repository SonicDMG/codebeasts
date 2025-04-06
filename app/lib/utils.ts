import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from "sonner"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function downloadImageClientSide(imageUrl: string, username: string) {
  if (typeof window === "undefined") return;

  try {
    const apiUrl = `/api/download?url=${encodeURIComponent(imageUrl)}&username=${encodeURIComponent(username)}`;
    
    window.location.href = apiUrl;

    toast.success("CodeBeast download initiated...");

  } catch (error) {
    console.error("Download initiation error:", error);
    toast.error("Failed to initiate download.");
  }
}
