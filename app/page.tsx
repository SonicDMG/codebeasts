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
    <div className="container mx-auto px-4 pt-8 pb-8 w-full">
      {/* Max Width Container - Centered Text */}
      <div className="max-w-4xl w-full mx-auto text-center">
        {/* Hero Section - Reduced bottom margin further */}
        <div className="flex flex-col items-center justify-center mb-4">
          {/* Ensure heading is text-3xl, adjust margin */}
          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500 text-transparent bg-clip-text tracking-tight">
            Transform Your Code Into a Beast!
            <span className="inline-block ml-2">🐉</span>
          </h1>
          {/* Reduced top margin for subtitle */}
          <p className="text-base text-white/70 text-center leading-relaxed mt-1">
            Turn your GitHub profile into a unique AI-generated creature
            <br />
            that reflects your coding prowess
          </p>
        </div>

        {/* Logo Image - Reduced bottom margin */}
        <div className="mb-6 flex justify-center"> 
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