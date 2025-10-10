/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['api.repliers.io'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.repliers.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
