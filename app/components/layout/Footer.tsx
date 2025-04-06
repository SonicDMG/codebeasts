// import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <div className="mt-8 py-4 border-t border-border sticky bottom-0 left-0 right-0 bg-background z-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-sm text-muted-foreground gap-2">
          <p>
            <a 
              href="https://github.com/SonicDMG/codebeasts" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              GitHub
            </a>
          </p>
          <div>
            <a 
              href="https://www.datastax.com/blog/generate-personalized-mythical-creatures-with-langflow"
              target="_blank"
              rel="noopener noreferrer" 
              className="hover:text-primary transition-colors"
            >
              Learn how this app was built
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
