/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker - Required for your Dockerfile
  output: 'standalone',
  
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        '192.168.228.106:3000',
        '192.168.115.106:3000', // Added your other local IP from .env
      ],
    },
  },
  
  // Proxy backend requests
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/:path*',
        // Uses BACKEND_URL env var: set to 'http://backend:8000' in Docker, defaults to localhost for local dev
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**', // Fallback for other HTTPS sources
      },
      {
        protocol: 'http',
        hostname: '**', // Covers local network testing
      },
    ],
    // Optimize Cloudinary image loading
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;