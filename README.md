# GTCS — Gentech Consultancy Services Website

Beautiful, production-ready company website for **Gentech Consultancy Services (GTCS)**.

**Tech stack:** Next.js 15 · TypeScript · Tailwind CSS · Supabase · Resend

---

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Hero, stats, services overview, HospiFlow spotlight, testimonials, blog preview |
| Services | `/services` | Digital marketing, mobile apps, desktop apps, web dev — full detail with process |
| Pricing | `/pricing` | All HospiFlow SaaS plans (from saas-backend) with modules, bundles, and add-ons |
| Education | `/education` | Free coaching — school, competitive exams, tech skills, upcoming batches |
| Blog | `/blog` | Supabase-backed blog with search, categories, newsletter subscribe |
| Blog Post | `/blog/[slug]` | Full post with share to WhatsApp + Twitter |
| Contact | `/contact` | Form → Supabase lead + auto email via Resend + auto-reply to customer |
| About | `/about` | Mission, values, team, milestones |

---

## Quick Start

```bash
cd gtcs
npm install

# Copy env file
cp .env.example .env.local
# → Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, RESEND_API_KEY, etc.

# Run database schema (one time)
# → Go to https://supabase.com → Your project → SQL Editor
# → Paste and run: supabase/schema.sql

npm run dev
# Open http://localhost:3000
```

---

## Environment Variables

See [.env.example](.env.example) for the full list. Key ones:

```env
NEXT_PUBLIC_SUPABASE_URL=        # from Supabase dashboard
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # anon key (safe in browser)
RESEND_API_KEY=                  # from resend.com (free: 100 emails/day)
ADMIN_EMAIL=                     # where lead emails are sent
NEXT_PUBLIC_WHATSAPP=            # e.g. 919876543210 (no + or spaces)
NEXT_PUBLIC_PHONE=               # e.g. +91 98765 43210
NEXT_PUBLIC_EMAIL=               # e.g. hello@gentechcs.in
NEXT_PUBLIC_SITE_URL=            # e.g. https://gentechcs.in
```

---

## Deploy to Vercel (Recommended — Free)

```bash
# 1. Push to GitHub
git init && git add . && git commit -m "initial commit"
git remote add origin https://github.com/YOUR_ORG/gtcs-website.git
git push -u origin main

# 2. Go to vercel.com → Import GitHub repo
# 3. Add all environment variables in Vercel dashboard
# 4. Deploy — auto-deploys on every push to main
```

**Why Vercel over GitHub Pages:**
- GitHub Pages = static only (no API routes → no email sending)
- Vercel = full Next.js (API routes work → email, dynamic blog, etc.)
- Vercel free tier is generous and perfect for this

---

## Deploy to GitHub Pages (Static Export)

If you *must* use GitHub Pages:

1. In `next.config.ts`, uncomment `output: 'export'` and `trailingSlash: true`
2. Add `unoptimized: true` to images config
3. Email sending via `/api/contact` won't work — use Supabase insert only
4. GitHub Actions workflow example:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on: { push: { branches: [main] } }
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_WHATSAPP: ${{ secrets.NEXT_PUBLIC_WHATSAPP }}
          # ... all env vars
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

---

## Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `supabase/schema.sql`
3. Copy **Project URL** and **anon key** from Settings → API

### Posting Blogs

Use Supabase's table editor or build a simple admin page. A blog post requires:
- `slug` (URL-friendly, e.g. `my-first-post`)
- `title`
- `content` (HTML)
- `is_published: true`
- `published_at` (timestamp)

### Email Notifications for New Leads

Get a free API key from [resend.com](https://resend.com) → set `RESEND_API_KEY` and `ADMIN_EMAIL`.
Each contact form submission:
1. Saves lead to Supabase `leads` table
2. Sends notification email to admin with Name, Phone, Email, Service Interest + WhatsApp / Call buttons
3. Sends auto-reply to customer (if email provided)

---

## Project Structure

```
gtcs/
├── src/
│   ├── app/
│   │   ├── layout.tsx           ← Root layout (fonts, WhatsApp FAB)
│   │   ├── page.tsx             ← Home page
│   │   ├── globals.css          ← Global styles + design tokens
│   │   ├── api/
│   │   │   └── contact/route.ts ← Contact form email handler
│   │   ├── services/page.tsx
│   │   ├── pricing/page.tsx
│   │   ├── education/page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx         ← Blog listing
│   │   │   └── [slug]/page.tsx  ← Blog post detail
│   │   ├── contact/page.tsx
│   │   └── about/page.tsx
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── lib/
│       ├── supabase.ts          ← Blog, leads, newsletter functions
│       └── email.ts             ← Resend email helpers
├── supabase/
│   └── schema.sql               ← Run once in Supabase SQL Editor
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Connecting to saas-backend (HospiFlow)

The Pricing page links users to WhatsApp for subscriptions. To add direct API-based sign-up:

1. Set `NEXT_PUBLIC_SAAS_API_URL=https://your-backend.onrender.com` in `.env.local`
2. Create `/app/signup/page.tsx` that calls `POST /api/v1/auth/register`
3. Direct leads to Razorpay checkout after plan selection

---

## saas-backend Deployment (Render)

The `saas-backend/render.yaml` is ready. To deploy:

1. Push `saas-backend/` to a GitHub repo
2. Go to [render.com](https://render.com) → New Web Service → Connect GitHub repo
3. Render auto-detects `render.yaml` — just add the secret env vars:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (for payments)
   - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (or use Resend SMTP)
   - `FRONTEND_URL` = your GTCS website URL
4. Click Deploy — live URL in ~3 minutes

**Render free tier notes:**
- Spins down after 15 minutes of inactivity (cold start ~30s)
- For production, upgrade to Starter ($7/mo) to keep it always-on
