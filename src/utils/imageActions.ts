
/**
 * Utility functions for image-related actions such as downloading and social sharing.
 * Provides functionality for downloading CodeBeast images and sharing them on Twitter
 * with appropriate meta tags and formatted messages.
 */

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

export const shareOnTwitter = (imageUrl: string, handle: string) => {
  // Set app logo image URL
  const appLogoUrl = `${window.location.origin}/lovable-uploads/6e48cfe8-7c75-4565-939d-f665321ddd3a.png`;
  
  // Update the meta tags for Twitter card
  const metaImage = document.querySelector('meta[property="og:image"]');
  const metaTitle = document.querySelector('meta[property="og:title"]');
  const metaDescription = document.querySelector('meta[property="og:description"]');
  
  // Always update the image URL to the app logo
  if (metaImage) {
    metaImage.setAttribute('content', appLogoUrl);
  } else {
    const meta = document.createElement('meta');
    meta.setAttribute('property', 'og:image');
    meta.setAttribute('content', appLogoUrl);
    document.head.appendChild(meta);
  }

  // Update Twitter-specific meta tags
  let twitterImage = document.querySelector('meta[name="twitter:image"]');
  if (twitterImage) {
    twitterImage.setAttribute('content', appLogoUrl);
  } else {
    twitterImage = document.createElement('meta');
    twitterImage.setAttribute('name', 'twitter:image');
    twitterImage.setAttribute('content', appLogoUrl);
    document.head.appendChild(twitterImage);
  }

  // Ensure we have a Twitter card type
  const twitterCard = document.querySelector('meta[name="twitter:card"]');
  if (!twitterCard) {
    const cardMeta = document.createElement('meta');
    cardMeta.setAttribute('name', 'twitter:card');
    cardMeta.setAttribute('content', 'summary_large_image');
    document.head.appendChild(cardMeta);
  }

  // Set or update other Twitter-specific meta tags
  const tags = {
    'twitter:title': 'My Unique CodeBeast',
    'twitter:description': 'Check out my AI-generated GitHub profile creature!',
  };

  Object.entries(tags).forEach(([name, content]) => {
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (tag) {
      tag.setAttribute('content', content);
    } else {
      tag = document.createElement('meta');
      tag.setAttribute('name', name);
      tag.setAttribute('content', content);
      document.head.appendChild(tag);
    }
  });

  // Use query parameter format and include the handle in the URL
  const directImageUrl = `https://codebeasts.onrender.com/?u=${handle}`;
  const text = `Check out my unique CodeBeast! 🎮✨ Generated using my GitHub profile stats powered by @langflow_ai!\n\nHere's my CodeBeast: ${directImageUrl}\n\nGenerate your own: https://codebeasts.onrender.com\n\n#AIart #AgenticAI #AI #CodeArt`;
  
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  
  window.open(twitterUrl, '_blank', 'noopener,noreferrer');
};
