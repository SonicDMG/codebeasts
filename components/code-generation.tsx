'use client';

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

export function CodeGeneration() {
  const [prompt, setPrompt] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [generatedCode, setGeneratedCode] = React.useState("");
  const { toast } = useToast();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate/code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate code");
      }

      const data = await response.json();
      setGeneratedCode(data.code);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate code. Please try again.",
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
            <CardTitle>Code Generation</CardTitle>
            <CardDescription>
              Enter a description of the code you want to generate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Write a function that..."
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

      {generatedCode && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Code</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4">
              <code>{generatedCode}</code>
            </pre>
          </CardContent>
          <CardFooter>
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(generatedCode);
                toast({
                  title: "Copied",
                  description: "Code copied to clipboard",
                });
              }}
            >
              Copy to Clipboard
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 