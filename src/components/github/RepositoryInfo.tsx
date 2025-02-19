
import { GitFork } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface RepositoryInfoProps {
  repoCount: number;
  languages: string[];
  prompt: string;
  githubUrl?: string;
}

export const RepositoryInfo = ({ repoCount, languages, prompt, githubUrl }: RepositoryInfoProps) => {
  // Extract animal name from the prompt
  const getAnimalFromPrompt = (prompt: string): string => {
    // Regular expression to match "an X" or "a X" pattern
    const match = prompt.match(/(?:an?|the)\s+([^\s,]+(?:\s+[^\s,]+)*)\s+(?:with|in|that)/i);
    return match ? match[1] : 'mysterious creature';
  };

  return (
    <div className="space-y-4">
      {repoCount > 0 && (
        <div className="flex items-center gap-2 text-white/60">
          <GitFork className="h-4 w-4" />
          <a 
            href={githubUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-white/90 transition-colors"
          >
            {repoCount} repositories
          </a>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {languages.map((tech) => (
          <span key={tech} className="px-3 py-1 rounded-full glass text-sm text-white/60">
            {tech}
          </span>
        ))}
      </div>

      {prompt && (
        <Card className="p-4 bg-black/20 border-white/10">
          <h3 className="text-white/80 text-sm font-medium mb-2">Your CodeBeast</h3>
          <div className="text-white/60 text-sm">
            You're getting a {getAnimalFromPrompt(prompt)}!
          </div>
        </Card>
      )}
    </div>
  );
};
