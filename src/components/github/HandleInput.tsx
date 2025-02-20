
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface HandleInputProps {
  handle: string;
  isGenerating: boolean;
  onHandleChange: (value: string) => void;
  onGenerate: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const HandleInput = ({
  handle,
  isGenerating,
  onHandleChange,
  onGenerate,
  onKeyPress,
}: HandleInputProps) => {
  return (
    <div className="space-y-4">
      <Input
        placeholder="Enter GitHub handle to generate your beast..."
        value={handle}
        onChange={(e) => onHandleChange(e.target.value)}
        onKeyPress={onKeyPress}
        className="bg-black/40 border-white/20 text-white placeholder:text-white/50"
      />
      
      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate"
        )}
      </Button>
    </div>
  );
};
