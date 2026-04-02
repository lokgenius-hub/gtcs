import type { NextConfig } from 'next'

// When deployed to github.io/gtcs/ (no custom domain yet) set BASE_PATH=/gtcs
// Once gentechservices.in DNS is live, clear BASE_PATH — GitHub redirects to root
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: BASE_PATH,
  assetPrefix: BASE_PATH,

  images: {
    unoptimized: true,
  },
}

export default nextConfig
