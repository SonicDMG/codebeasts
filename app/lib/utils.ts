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

// Moved from app/components/code-beast-generator.tsx
// Note: This relies on window object, so it's client-side only.
export function shareOnTwitterClientSide(username: string) {
  if (typeof window === "undefined") return;

  const text = `Check out my unique AI-generated CodeBeast! 🦾\n\nGenerated for @${username} using @LangFlow and @GitHub\n\n`;
  // Construct the index page URL with the username query parameter
  const shareUrl = `${window.location.origin}/?u=${username.toLowerCase()}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
  window.open(twitterUrl, '_blank');
}
