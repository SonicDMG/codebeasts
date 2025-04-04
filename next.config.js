/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: '**.everart.ai',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
  },
  // Allow the cz-shortcut-listen attribute
  experimental: {
    allowedAttributesByTag: {
      body: ['cz-shortcut-listen'],
    },
  },
};

module.exports = nextConfig; 