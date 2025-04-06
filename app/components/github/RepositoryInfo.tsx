/**
 * Component that displays GitHub repository statistics and analysis results.
 * Shows repository count, programming languages used, and animal characteristics
 * selected for the CodeBeast generation.
 */

import { FileCode2, GitFork } from 'lucide-react';
import { Card } from "@/app/components/ui/card";

interface RepositoryInfoProps {
  repoCount: number;
  languages: string[];
  prompt: string;
  githubUrl?: string;
  animalSelection?: any[][];
}

const isPlaceholder = (item: string | undefined | null): boolean => {
  if (typeof item !== 'string') return true;
  return item === '[]' || item.startsWith('[None');
};

export const RepositoryInfo = ({ repoCount, languages, prompt, githubUrl, animalSelection }: RepositoryInfoProps) => {
  console.log("RepositoryInfo Component received languages:", languages);
  return (
    <div className="space-y-4">
      {typeof repoCount === 'number' && (
        <div className="flex items-center gap-2 text-white/60">
          <GitFork className="h-4 w-4" />
          <a 
            href={githubUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-white/90 transition-colors"
          >
            {repoCount} public repositories
          </a>
        </div>
      )}

      {languages && languages.length > 0 && (
        <div>
          <div className="flex flex-wrap gap-2">
            {languages.map((tech) => (
              <span key={tech} className="px-3 py-1 rounded-full glass text-sm text-white/60">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(animalSelection) && animalSelection.length > 0 && repoCount > 0 && (
        <Card className="p-4 bg-black/20 border-white/10">
          <h3 className="text-white/80 text-sm font-medium mb-2">Your CodeBeast Components</h3>
          <div className="space-y-2">
            {animalSelection
              .filter(entry => Array.isArray(entry) && entry.length >= 1 && typeof entry[0] === 'string' && !isPlaceholder(entry[0]))
              .map((entry, index) => {
                const category = entry[0];
                const trait = (entry.length > 1 && typeof entry[1] === 'string' && !isPlaceholder(entry[1])) ? entry[1] : "-";

                return (
                  <div key={index} className="text-white/60 text-sm">
                    <span>
                      <span className="font-medium text-white/80">{category}</span>
                      <span className="text-white/40"> — </span>
                      <span className="italic">{trait}</span>
                    </span>
                  </div>
                );
              })}
          </div>
        </Card>
      )}
    </div>
  );
};
