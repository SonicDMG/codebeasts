
import { Link, useLocation } from 'react-router-dom';

export const Header = () => {
  const location = useLocation();
  const isGalleryPage = location.pathname === '/gallery';

  return (
    <div className="flex justify-between items-center mt-0 mb-4">
      <div className="flex items-center gap-2">
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
        to={isGalleryPage ? "/" : "/gallery"}
        className="text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        {isGalleryPage ? "View Main" : "View Gallery"}
      </Link>
    </div>
  );
};
