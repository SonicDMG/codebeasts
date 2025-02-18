
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Zap } from "lucide-react";

interface ModelSelectorProps {
  model: string;
  onModelChange: (value: string) => void;
  disabled?: boolean;
}

export const ModelSelector = ({ model, onModelChange, disabled }: ModelSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-white/60">Select AI Model</Label>
      <RadioGroup
        value={model}
        onValueChange={onModelChange}
        className="flex space-x-4"
        disabled={disabled}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="dall_e" id="dall_e" />
          <Label htmlFor="dall_e" className="flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            DALL-E
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="stability" id="stability" />
          <Label htmlFor="stability" className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            Stability
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};
