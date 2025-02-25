
import { Link } from 'react-router-dom';

export const Header = () => {
  return (
    <div className="flex justify-between items-center mb-1">
      <div className="flex items-center gap-4">
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
        className="text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        View Gallery
      </Link>
    </div>
  );
};
