'use client'; // Make this a client component to use hooks

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Import usePathname

export function Header() {
  const pathname = usePathname(); // Get the current path
  const isGalleryPage = pathname === '/gallery'; // Check if we are on the gallery page

  // Determine link text and href dynamically
  const linkHref = isGalleryPage ? '/' : '/gallery';
  const linkText = isGalleryPage ? 'View Main' : 'View Gallery';

  return (
    <div className="absolute top-0 left-0 right-0 flex justify-between items-center py-4 px-6 text-gray-400 z-10 text-sm">
      <div className="flex items-center">
        <span className="opacity-60 mr-1.5">powered by</span>
        <Link href="https://langflow.new/ui/f/codebeasts" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
          Langflow
        </Link>
      </div>
      {/* Use the dynamic variables for the link */}
      <Link href={linkHref} className="text-gray-400 hover:text-white transition">
        {linkText}
      </Link>
    </div>
  );
}
