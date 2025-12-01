/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['api.repliers.io', 'cdn.repliers.io', 'omsefyactufffyqaxowx.supabase.co', 'shared-s3.property.ca'],
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
  },
}

module.exports = nextConfig
