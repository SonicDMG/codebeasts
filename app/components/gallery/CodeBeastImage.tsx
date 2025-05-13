import React from "react";
import Image from "next/image";
import styles from "./BeastCard.module.css";

interface CodeBeastImageProps {
  imageUrl: string;
  alt?: string;
  showQR?: boolean;
  showLabel?: boolean;
  className?: string;
}

export const CodeBeastImage: React.FC<CodeBeastImageProps> = ({
  imageUrl,
  alt = "CodeBeast image",
  showQR = true,
  showLabel = true,
  className = "",
}) => {
  return (
    <div className={`relative w-full h-full aspect-square overflow-hidden ${className}`}>
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority
      />
      {showQR && (
        <img
          src="/images/to_langflow.png"
          alt="QR Code to Langflow"
          className={styles.qrOverlay}
          aria-hidden="true"
        />
      )}
      {showLabel && (
        <a
          href="https://langflow.new/ui/f/codebeasts"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.labelOverlay + " hover:underline focus:underline"}
          aria-label="Learn more about Langflow"
        >
          Generated with Langflow
        </a>
      )}
    </div>
  );
}; 