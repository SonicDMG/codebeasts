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
    <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-6 text-gray-400 z-10">
      <div className="flex items-center gap-4">
        <span className="opacity-60">powered by</span>
        <Link href="https://flowiseai.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
          Langflow
        </Link>
        <Link href="https://github.com/SonicDMG/codebeasts" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
          GitHub
        </Link>
      </div>
      {/* Use the dynamic variables for the link */}
      <Link href={linkHref} className="text-gray-400 hover:text-white transition">
        {linkText}
      </Link>
    </div>
  );
}
