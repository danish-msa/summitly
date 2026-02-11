/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Removed deprecated 'domains', using only 'remotePatterns'
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.repliers.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.repliers.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'shared-s3.property.ca',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'summitly-storage.s3.ca-central-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.ca-central-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'shared-s3.property.ca',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'summitly.vercel.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'summitly.vercel.app',
        port: '',
        pathname: '/**',
      },
    ],
    // Configure image qualities for Next.js 16 compatibility
    qualities: [75, 100],
    // Optimize image formats and caching
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Standalone output for API-only deployment
  // This creates a minimal server.js file that can be deployed separately
  output: process.env.NEXT_STANDALONE === 'true' ? 'standalone' : undefined,
}

module.exports = nextConfig
