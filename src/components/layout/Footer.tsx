
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <div className="mt-8 py-4 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} CodeBeasts</p>
          <div className="mt-2 md:mt-0">
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
