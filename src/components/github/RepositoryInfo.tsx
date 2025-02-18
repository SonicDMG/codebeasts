
import { GitFork } from 'lucide-react';

interface RepositoryInfoProps {
  repoCount: number;
  languages: string[];
  prompt: string;
  githubUrl?: string;
}

export const RepositoryInfo = ({ repoCount, languages, prompt, githubUrl }: RepositoryInfoProps) => {
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
        <div className="p-4 rounded-lg bg-black/20 border border-white/10">
          <p className="text-white/80 text-sm leading-relaxed">
            {prompt}
          </p>
        </div>
      )}
    </div>
  );
};
