
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
  // Update the meta tags for Twitter card
  const metaImage = document.querySelector('meta[property="og:image"]');
  const metaTitle = document.querySelector('meta[property="og:title"]');
  const metaDescription = document.querySelector('meta[property="og:description"]');
  
  if (metaImage) {
    metaImage.setAttribute('content', imageUrl);
  } else {
    const meta = document.createElement('meta');
    meta.setAttribute('property', 'og:image');
    meta.setAttribute('content', imageUrl);
    document.head.appendChild(meta);
  }

  if (!metaTitle) {
    const titleMeta = document.createElement('meta');
    titleMeta.setAttribute('property', 'og:title');
    titleMeta.setAttribute('content', 'My Unique CodeBeast');
    document.head.appendChild(titleMeta);
  }

  if (!metaDescription) {
    const descMeta = document.createElement('meta');
    descMeta.setAttribute('property', 'og:description');
    descMeta.setAttribute('content', 'Check out my AI-generated GitHub profile creature!');
    document.head.appendChild(descMeta);
  }

  // Create Twitter-specific meta tags
  const twitterCard = document.querySelector('meta[name="twitter:card"]');
  if (!twitterCard) {
    const cardMeta = document.createElement('meta');
    cardMeta.setAttribute('name', 'twitter:card');
    cardMeta.setAttribute('content', 'summary_large_image');
    document.head.appendChild(cardMeta);
  }

  const text = `Check out my unique CodeBeast! 🎮✨ Generated using my GitHub profile stats powered by @langflow_ai!\n\nGenerate your own: https://codebeasts.onrender.com\n\n#AIart #AgenticAI #AI #CodeArt`;
  
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  
  window.open(twitterUrl, '_blank', 'noopener,noreferrer');
};
