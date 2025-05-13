/**
 * Utility functions for image-related actions such as downloading and social sharing.
 * Provides functionality for downloading CodeBeast images and sharing them on Twitter
 * with appropriate meta tags and formatted messages.
 */

export const downloadImage = async (imageUrl: string, handle: string, toast: any) => {
  try {
    // Use proxy for Google Cloud Storage images
    let proxiedUrl = imageUrl;
    if (imageUrl.startsWith('https://storage.googleapis.com/')) {
      proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    }

    // Load the main CodeBeast image
    const codebeastImg = new window.Image();
    codebeastImg.crossOrigin = 'anonymous';
    codebeastImg.src = proxiedUrl;

    // Load the QR code image
    const qrImg = new window.Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.src = '/images/to_langflow.png';

    // Wait for both images to load
    await Promise.all([
      new Promise((resolve, reject) => {
        codebeastImg.onload = () => { resolve(undefined); };
        codebeastImg.onerror = (e) => { reject(e); };
      }),
      new Promise((resolve, reject) => {
        qrImg.onload = () => { resolve(undefined); };
        qrImg.onerror = (e) => { reject(e); };
      })
    ]);

    // Create a canvas with the same size as the CodeBeast image
    const width = codebeastImg.width;
    const height = codebeastImg.height;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Draw the CodeBeast image
    ctx.drawImage(codebeastImg, 0, 0, width, height);

    // Draw QR code in the absolute bottom left (no margin)
    const qrSize = Math.round(width * 0.15);
    ctx.drawImage(qrImg, 0, height - qrSize, qrSize, qrSize);

    // Draw the 'Generated with Langflow' label in the bottom right
    const labelText = 'Generated with Langflow';
    const fontSize = Math.round(width * 0.035); // Responsive font size
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'right';
    const textPaddingX = Math.round(width * 0.015);
    const textPaddingY = Math.round(width * 0.012);
    const textMetrics = ctx.measureText(labelText);
    const labelWidth = textMetrics.width + textPaddingX * 2;
    const labelHeight = fontSize + textPaddingY * 2;
    const labelX = width - textPaddingX;
    const labelY = height - textPaddingY;

    // Draw background (dark translucent, rounded corners)
    ctx.save();
    ctx.beginPath();
    const radius = Math.round(fontSize * 0.6);
    ctx.moveTo(labelX - labelWidth + radius, labelY - labelHeight);
    ctx.lineTo(labelX - radius, labelY - labelHeight);
    ctx.quadraticCurveTo(labelX, labelY - labelHeight, labelX, labelY - labelHeight + radius);
    ctx.lineTo(labelX, labelY - radius);
    ctx.quadraticCurveTo(labelX, labelY, labelX - radius, labelY);
    ctx.lineTo(labelX - labelWidth + radius, labelY);
    ctx.quadraticCurveTo(labelX - labelWidth, labelY, labelX - labelWidth, labelY - radius);
    ctx.lineTo(labelX - labelWidth, labelY - labelHeight + radius);
    ctx.quadraticCurveTo(labelX - labelWidth, labelY - labelHeight, labelX - labelWidth + radius, labelY - labelHeight);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fill();
    ctx.restore();

    // Draw text
    ctx.fillStyle = '#fff';
    ctx.fillText(labelText, labelX - textPaddingX, labelY - textPaddingY);

    // Download the composited image
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `codebeast-${handle}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast('Your CodeBeast image (with QR code) is being downloaded.');
  } catch (error) {
    toast.error('There was an error downloading your image.');
  }
};

export const shareOnTwitter = (imageUrl: string, handle: string) => {
  // Set app logo image URL
  const appLogoUrl = `${window.location.origin}/lovable-uploads/6e48cfe8-7c75-4565-939d-f665321ddd3a.png`;
  
  // Update the meta tags for Twitter card
  const metaImage = document.querySelector('meta[property="og:image"]');
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

export const printImage = async (imageUrl: string, handle: string, toast: any) => {
  try {
    // Use proxy for Google Cloud Storage images
    let proxiedUrl = imageUrl;
    if (imageUrl.startsWith('https://storage.googleapis.com/')) {
      proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    }

    // Load the main CodeBeast image
    const codebeastImg = new window.Image();
    codebeastImg.crossOrigin = 'anonymous';
    codebeastImg.src = proxiedUrl;

    // Load the QR code image
    const qrImg = new window.Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.src = '/images/to_langflow.png';

    // Wait for both images to load
    await Promise.all([
      new Promise((resolve, reject) => {
        codebeastImg.onload = () => { resolve(undefined); };
        codebeastImg.onerror = (e) => { reject(e); };
      }),
      new Promise((resolve, reject) => {
        qrImg.onload = () => { resolve(undefined); };
        qrImg.onerror = (e) => { reject(e); };
      })
    ]);

    // Step 1: Crop the square image to a 5x7 aspect ratio (center crop)
    const srcWidth = codebeastImg.width;
    const srcHeight = codebeastImg.height;
    const targetAspect = 5 / 7;
    let cropWidth = srcWidth;
    let cropHeight = Math.round(srcWidth / targetAspect);
    if (cropHeight > srcHeight) {
      cropHeight = srcHeight;
      cropWidth = Math.round(srcHeight * targetAspect);
    }
    const cropX = Math.floor((srcWidth - cropWidth) / 2);
    const cropY = Math.floor((srcHeight - cropHeight) / 2);

    // Step 2: Draw the cropped image to a new canvas
    const DPI = 300;
    const printWidth = 5 * DPI;
    const printHeight = 7 * DPI;
    const imgCanvas = document.createElement('canvas');
    imgCanvas.width = printWidth;
    imgCanvas.height = printHeight;
    const imgCtx = imgCanvas.getContext('2d');
    if (!imgCtx) throw new Error('Could not get canvas context');

    // Fill background white for print
    imgCtx.fillStyle = '#fff';
    imgCtx.fillRect(0, 0, printWidth, printHeight);

    // Draw the cropped portion of the image, scaled to fill the 5x7 canvas
    imgCtx.drawImage(
      codebeastImg,
      cropX, cropY, cropWidth, cropHeight, // source crop
      0, 0, printWidth, printHeight        // destination
    );

    // Step 3: Composite overlays (QR code and label) within the 5x7 area
    // Draw QR code in the absolute bottom left (no margin)
    const qrSize = Math.round(printWidth * 0.15);
    imgCtx.drawImage(qrImg, 0, printHeight - qrSize, qrSize, qrSize);

    // Draw the 'Generated with Langflow' label in the bottom right (within print bounds)
    const labelText = 'Generated with Langflow';
    const fontSize = Math.round(printWidth * 0.035); // Responsive font size
    imgCtx.font = `bold ${fontSize}px sans-serif`;
    imgCtx.textBaseline = 'bottom';
    imgCtx.textAlign = 'right';
    const textPaddingX = Math.round(printWidth * 0.015);
    const textPaddingY = Math.round(printWidth * 0.012);
    const textMetrics = imgCtx.measureText(labelText);
    const labelWidth = textMetrics.width + textPaddingX * 2;
    const labelHeight = fontSize + textPaddingY * 2;
    const labelX = printWidth - textPaddingX;
    const labelY = printHeight - textPaddingY;

    // Draw background (dark translucent, rounded corners)
    imgCtx.save();
    imgCtx.beginPath();
    const radius = Math.round(fontSize * 0.6);
    imgCtx.moveTo(labelX - labelWidth + radius, labelY - labelHeight);
    imgCtx.lineTo(labelX - radius, labelY - labelHeight);
    imgCtx.quadraticCurveTo(labelX, labelY - labelHeight, labelX, labelY - labelHeight + radius);
    imgCtx.lineTo(labelX, labelY - radius);
    imgCtx.quadraticCurveTo(labelX, labelY, labelX - radius, labelY);
    imgCtx.lineTo(labelX - labelWidth + radius, labelY);
    imgCtx.quadraticCurveTo(labelX - labelWidth, labelY, labelX - labelWidth, labelY - radius);
    imgCtx.lineTo(labelX - labelWidth, labelY - labelHeight + radius);
    imgCtx.quadraticCurveTo(labelX - labelWidth, labelY - labelHeight, labelX - labelWidth + radius, labelY - labelHeight);
    imgCtx.closePath();
    imgCtx.fillStyle = 'rgba(0,0,0,0.6)';
    imgCtx.fill();
    imgCtx.restore();

    // Draw text
    imgCtx.fillStyle = '#fff';
    imgCtx.fillText(labelText, labelX - textPaddingX, labelY - textPaddingY);

    // Step 4: Print the composited image
    const dataUrl = imgCanvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>Print CodeBeast</title><style>@media print { body { margin: 0; } img { width: 100%; height: auto; } }</style></head><body><img src='${dataUrl}' style='width:100%;max-width:5in;max-height:7in;display:block;margin:auto;'/></body></html>`);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); }, 500);
    } else {
      toast.error('Could not open print dialog.');
    }
    toast('Your CodeBeast image is ready to print (5x7 portrait, cropped).');
  } catch (error) {
    toast.error('There was an error preparing your image for print.');
  }
};
