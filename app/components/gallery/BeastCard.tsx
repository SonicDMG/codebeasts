'use client';

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
  return (
    <Card className="overflow-hidden bg-[#0D1117] border-[#30363D]">
      <CardContent className="p-0">
        <div className="aspect-square relative">
          <Image
            src={beast.image_url}
            alt={`CodeBeast for ${beast.username}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div 
            className="absolute bottom-4 right-4 text-white text-sm font-semibold"
            style={{ 
              textShadow: '1px 1px 2px black', 
              backgroundColor: 'rgba(0,0,0,0.3)',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
          >
            Generated with Langflow
          </div>
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