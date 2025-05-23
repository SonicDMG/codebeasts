/**
 * Component that provides the GitHub handle input field and generation button.
 * Includes loading state handling and keyboard event support for submission.
 */

import React from 'react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Loader2 } from 'lucide-react';

interface HandleInputProps {
  handle: string;
  isGenerating: boolean;
  onHandleChange: (value: string) => void;
  onGenerate: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const validateGitHubHandle = (handle: string): boolean => {
  // GitHub username requirements:
  // - Only alphanumeric characters and hyphens
  // - Cannot start or end with hyphen
  // - Maximum length 39 characters
  const githubUsernameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
  return githubUsernameRegex.test(handle);
};

export const HandleInput = ({
  handle,
  isGenerating,
  onHandleChange,
  onGenerate,
  onKeyPress,
}: HandleInputProps) => {
  const isValidHandle = validateGitHubHandle(handle);
  const showError = handle.length > 0 && !isValidHandle;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Input
          placeholder="Enter GitHub handle to generate your beast..."
          value={handle}
          onChange={(e) => onHandleChange(e.target.value)}
          onKeyPress={onKeyPress}
          className={`bg-black/40 border-white/20 text-white placeholder:text-white/50 ${
            showError ? 'border-red-500' : ''
          }`}
          maxLength={39}
          aria-invalid={showError}
          aria-describedby={showError ? "handle-error" : undefined}
        />
        {showError && (
          <p id="handle-error" className="text-sm text-red-500">
            Please enter a valid GitHub username (alphanumeric characters and single hyphens only)
          </p>
        )}
      </div>
      
      <Button
        onClick={onGenerate}
        disabled={isGenerating || !isValidHandle || handle.length === 0}
        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-white" />
            <span>Generating...</span>
          </>
        ) : (
          "Generate"
        )}
      </Button>
    </div>
  );
};
