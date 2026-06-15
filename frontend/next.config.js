/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      { source: '/api/v1/:path*', destination: 'http://localhost:8080/api/v1/:path*' },
      { source: '/ws/:path*', destination: 'http://localhost:8001/ws/:path*' },
    ]
  },
}
module.exports = nextConfig
