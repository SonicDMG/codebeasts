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

  // Get the base origin URL
  const originUrl = window.location.origin;
  // Construct the specific beast URL
  const beastUrl = `${originUrl}/?u=${username.toLowerCase()}`;
  
  // Option D Text (Hinting at Emotion Choices)
  const text = `This AI beast was generated from @${username}'s GitHub profile! 🐲 Generate yours with its own personality (like Zen, Zombie, or Ghibli style!). What will your code conjure?\n\nConjure Yours: ${originUrl}\n\n#CodeBeasts #AI #AIart #GenerativeArt #GitHub @langflow_ai`;

  // Explicitly set the URL for Twitter card preview (this will be displayed as the card)
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(beastUrl)}`; 
  window.open(twitterUrl, '_blank');
}
