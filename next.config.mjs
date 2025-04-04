/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['oaidalleapiprodscus.blob.core.windows.net'], // For DALL-E images
  },
  experimental: {
    serverActions: true,
  },
};

export default nextConfig; 