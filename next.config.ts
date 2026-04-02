import type { NextConfig } from 'next'

// ─────────────────────────────────────────────────────────────────────────────
// DOWNLOAD FILE HOSTING
// ─────────────────────────────────────────────────────────────────────────────
// The .exe and .apk files are too large to store in the repo (Vercel 100MB limit).
// They are hosted on GitHub Releases (free, permanent CDN) and served via redirects.
//
// HOW TO UPDATE:
//   1. Build the .exe:  cd hospiflow-desktop && npm run dist:win
//   2. Build the .apk:  eas build --platform android (in hospiflow-mobile/)
//   3. Upload both files to a GitHub Release:
//      https://github.com/YOUR_ORG/hospiflow/releases/new
//   4. Copy the download links and update these env vars in .env.local / Vercel:
//      DOWNLOAD_EXE_URL=https://github.com/...releases/download/v1.0.0/HospiFlow-Setup.exe
//      DOWNLOAD_APK_URL=https://github.com/...releases/download/v1.0.0/hospiflow-pos.apk
// ─────────────────────────────────────────────────────────────────────────────

const EXE_URL =
  process.env.DOWNLOAD_EXE_URL ||
  'https://github.com/gentech-consultancy/hospiflow/releases/download/v1.0.0/HospiFlow-Setup.exe'

const APK_URL =
  process.env.DOWNLOAD_APK_URL ||
  'https://github.com/gentech-consultancy/hospiflow/releases/download/v1.0.0/hospiflow-pos.apk'

const nextConfig: NextConfig = {
  // ── Deploy to Vercel (recommended — free, supports API routes + ISR) ──────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'github.com' },
      { protocol: 'https', hostname: 'objects.githubusercontent.com' },
    ],
  },

  // ── Download redirects ───────────────────────────────────────────────────
  // When user clicks download on /download page, these redirect to the real files
  // hosted on GitHub Releases (or any CDN — just update the env vars above).
  async redirects() {
    return [
      {
        source: '/downloads/HospiFlow-Setup.exe',
        destination: EXE_URL,
        permanent: false, // 307 — allows URL to change when new version ships
      },
      {
        source: '/downloads/hospiflow-pos.apk',
        destination: APK_URL,
        permanent: false,
      },
    ]
  },
}

export default nextConfig
