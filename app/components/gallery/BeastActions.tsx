'use client';

import { Button } from "@/app/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { downloadImageClientSide, shareOnTwitterClientSide } from "@/app/lib/utils";

interface BeastActionsProps {
  imageUrl: string;
  username: string;
}

export function BeastActions({ imageUrl, username }: BeastActionsProps) {
  const handleDownload = () => downloadImageClientSide(imageUrl, username);
  
  const handleShare = () => {
    shareOnTwitterClientSide(username);
    toast.success("Twitter share dialog opened");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 mt-4 w-full">
      {/* Using styles from CodeBeastGenerator for potentially better look */}
      <Button 
        variant="outline"
        onClick={handleShare}
        className="flex-1 bg-black/20 border-white/10 text-white hover:bg-black/30 text-md font-medium rounded-xl"
      >
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </Button>
      <Button 
        variant="outline"
        onClick={handleDownload}
        className="flex-1 bg-black/20 border-white/10 text-white hover:bg-black/30 text-md font-medium rounded-xl"
      >
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
    </div>
  );
} 