
export const downloadImage = async (imageUrl: string, handle: string, toast: any) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codebeast-${handle}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Download started",
      description: "Your CodeBeast image is being downloaded.",
    });
  } catch (error) {
    toast({
      title: "Download failed",
      description: "There was an error downloading your image.",
      variant: "destructive",
    });
  }
};

export const shareOnTwitter = (imageUrl: string) => {
  const text = `Check out my unique CodeBeast! 🎮✨ Generated using my GitHub profile stats powered by @langflow_ai!\n\nGenerate your own: https://codebeasts.onrender.com\n\n${imageUrl}\n\n#AIart #AgenticAI #AI #CodeArt`;
  
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  
  window.open(twitterUrl, '_blank', 'noopener,noreferrer');
};
