'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import CodeBeastGenerator from "@/app/components/code-beast-generator";

export default function Home() {
  const router = useRouter();
  const params = useSearchParams();
  const username = params ? params.get('u') : null;

  useEffect(() => {
    if (username) {
      router.push(`/direct/${username}`);
    }
  }, [username, router]);

  return (
    <div className="container mx-auto px-4 pb-8 w-full">
      {/* Max Width Container - Centered Text */}
      <div className="max-w-4xl w-full mx-auto text-center">
        {/* Hero Section - Reduce heading size and bottom margin */}
        <div className="flex flex-col items-center justify-center mb-6">
          {/* Further reduced heading size */}
          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500 text-transparent bg-clip-text tracking-tight">
            Transform Your Code Into a Beast!
            <span className="inline-block ml-2">🐉</span>
          </h1>
          <p className="text-base text-white/70 text-center leading-relaxed">
            Turn your GitHub profile into a unique AI-generated creature
            <br />
            that reflects your coding prowess
          </p>
        </div>

        {/* Logo Image - Halved size again, added hover effect */}
        <div className="mb-8 flex justify-center"> 
          <img 
            src="/images/logo.png" 
            alt="CodeBeasts Logo" 
            className="w-full max-w-xs rounded-lg shadow-lg transition-transform duration-300 ease-in-out hover:scale-110"
          />
        </div>

        {/* Generator Component - Centered within max-w-4xl */}
        <CodeBeastGenerator />
      </div>
    </div>
  );
} 