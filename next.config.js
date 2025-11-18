/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['api.repliers.io', 'cdn.repliers.io'],
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
    ],
  },
}

module.exports = nextConfig
