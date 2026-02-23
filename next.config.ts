import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/suggestions',
        destination: 'http://127.0.0.1:5000/api/suggestions', // Proxy to Flask server in development
      },
      {
        source: '/api/extract-skills',
        destination: 'http://127.0.0.1:5000/api/extract-skills', // Proxy to Flask server in development
      },
    ];
  },
};

export default nextConfig;
