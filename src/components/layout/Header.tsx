
/**
 * Header component that provides navigation links and external resources.
 * Displays "powered by Langflow" and GitHub links on the left, and a Gallery link on the right.
 */

import { Link } from 'react-router-dom';

export const Header = () => {
  return (
    <div className="flex justify-between items-center mt-0 mb-4 px-1">
      <div className="flex items-center gap-4 -mt-1">
        <a 
          href="https://langflow.new" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          powered by Langflow
        </a>
        <a 
          href="https://github.com/SonicDMG/codebeasts" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          GitHub
        </a>
      </div>
      <Link
        to="/gallery"
        className="text-sm text-muted-foreground hover:text-primary transition-colors -mt-1"
      >
        View Gallery
      </Link>
    </div>
  );
};
