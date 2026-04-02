import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ── Static export for GitHub Pages ───────────────────────────────────────
  output: 'export',
  trailingSlash: true,

  // ── Image optimisation disabled (not supported on static hosts) ──────────
  images: {
    unoptimized: true,
  },
}

export default nextConfig
