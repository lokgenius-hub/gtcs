DO NOT store .exe or .apk files here
======================================

The HospiFlow-Setup.exe and hospiflow-pos.apk files are NOT stored in this folder.
They are hosted on GitHub Releases (free CDN) and served via Next.js redirects.

How downloads work:
  User clicks "Download" on /download page
        ↓
  Browser requests /downloads/HospiFlow-Setup.exe
        ↓
  next.config.ts redirects (307) to GitHub Releases CDN:
  https://github.com/gentech-consultancy/hospiflow/releases/download/v1.0.0/HospiFlow-Setup.exe
        ↓
  Browser downloads the real file from GitHub CDN (fast, free, permanent)


WHY GitHub Releases?
  - Vercel free tier: 100MB deployment limit — .exe (~85MB) + .apk (~25MB) = too big
  - GitHub Releases: 2GB per file, unlimited downloads, permanent CDN URLs
  - Completely free and reliable


HOW TO RELEASE A NEW VERSION:
  1. Build Windows .exe:
       cd hospiflow-desktop
       npm run dist:win
       → creates release/HospiFlow-Setup.exe

  2. Build Android APK:
       cd hospiflow-mobile
       eas build --platform android --profile preview
       → downloads .apk from Expo servers

  3. Create a GitHub Release:
       Go to: https://github.com/YOUR_ORG/hospiflow/releases/new
       Tag: v1.0.1
       Upload: HospiFlow-Setup.exe and hospiflow-pos.apk as release assets

  4. Update download URLs (optional — only if repo/tag changes):
       Edit next.config.ts  OR  set env vars in Vercel dashboard:
         DOWNLOAD_EXE_URL=https://github.com/.../releases/download/v1.0.1/HospiFlow-Setup.exe
         DOWNLOAD_APK_URL=https://github.com/.../releases/download/v1.0.1/hospiflow-pos.apk

  5. Redeploy GTCS website (or just update env vars in Vercel — no redeploy needed)


ALTERNATIVE HOSTING OPTIONS:
  - Supabase Storage: Upload to public bucket → use signed URL
  - Cloudflare R2: Free 10GB/month egress
  - Google Drive / OneDrive: Direct download links work too
  Just update DOWNLOAD_EXE_URL and DOWNLOAD_APK_URL env vars.
