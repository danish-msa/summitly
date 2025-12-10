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
        hostname: 'omsefyactufffyqaxowx.supabase.co',
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
    ],
    // Configure image qualities for Next.js 16 compatibility
    qualities: [75, 100],
  },
}

module.exports = nextConfig
