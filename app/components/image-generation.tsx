'use client';

import * as React from "react";
import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { useToast } from "@/app/components/ui/use-toast";
import { downloadImage } from "@/app/utils/imageActions";

const models = [
  { id: "5000", name: "FLUX1.1", description: "Standard quality" },
  { id: "9000", name: "FLUX1.1-ultra", description: "Ultra high quality" },
  { id: "6000", name: "SD3.5", description: "Stable Diffusion 3.5" },
  { id: "7000", name: "Recraft-Real", description: "Photorealistic style" },
  { id: "8000", name: "Recraft-Vector", description: "Vector art style" },
];

export function ImageGeneration() {
  const [prompt, setPrompt] = React.useState("");
  const [model, setModel] = React.useState(models[0].id);
  const [isLoading, setIsLoading] = React.useState(false);
  const [generatedImage, setGeneratedImage] = React.useState("");
  const { toast } = useToast();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          model,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data = await response.json();
      setGeneratedImage(data.url);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate image. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Image Generation</CardTitle>
            <CardDescription>
              Enter a description of the image you want to generate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="model">Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} - {m.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="A beautiful landscape..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || !prompt}>
              {isLoading ? "Generating..." : "Generate"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {generatedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-square overflow-hidden rounded-lg">
              <Image
                src={generatedImage}
                alt={prompt}
                fill
                className="object-cover"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="secondary"
              onClick={() => {
                window.open(generatedImage, "_blank");
              }}
            >
              Open in New Tab
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadImage(generatedImage, prompt || "image", toast)}
            >
              Download
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 