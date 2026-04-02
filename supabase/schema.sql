-- ═══════════════════════════════════════════════════════════════════════
-- GTCS Website — Supabase Schema
-- Run this once in your Supabase project → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- ── BLOG POSTS ───────────────────────────────────────────────────────────
create table if not exists blog_posts (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    text not null default 'gtcs',

  slug         text not null unique,
  title        text not null,
  excerpt      text,
  content      text,                   -- HTML (from WYSIWYG / MDX)
  cover_image  text,                   -- URL

  category     text,                   -- e.g. 'SaaS & Tech', 'Marketing'
  tags         text[],
  author       text default 'GTCS Team',
  author_avatar text,

  is_published  boolean not null default false,
  published_at  timestamptz default now(),
  read_time     int,                   -- minutes

  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Full-text search index
create index if not exists blog_posts_search_idx
  on blog_posts using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(content,'')));

-- Row Level Security — public can READ published posts
alter table blog_posts enable row level security;
create policy "Public read published posts" on blog_posts
  for select using (is_published = true);

-- ── LEADS / CONTACT FORM ─────────────────────────────────────────────────
create table if not exists leads (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        text not null default 'gtcs',

  name             text not null,
  phone            text not null,
  email            text,
  service_interest text,
  message          text,
  source           text default 'website_contact',  -- website_contact, whatsapp, referral...

  status           text default 'new',              -- new, contacted, converted, lost
  notes            text,                            -- internal admin notes

  created_at       timestamptz default now()
);

-- RLS — only INSERT allowed for public (no read)
alter table leads enable row level security;
create policy "Public insert leads" on leads
  for insert with check (true);

-- Admin can read all leads (via service role in your admin panel)

-- ── NEWSLETTER SUBSCRIBERS ───────────────────────────────────────────────
create table if not exists newsletter_subscribers (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      text not null default 'gtcs',

  email          text not null unique,
  subscribed_at  timestamptz default now(),
  unsubscribed_at timestamptz,
  is_active      boolean default true
);

alter table newsletter_subscribers enable row level security;
create policy "Public insert subscribers" on newsletter_subscribers
  for insert with check (true);
-- Upsert (update) also needs a policy:
create policy "Subscribers can upsert self" on newsletter_subscribers
  for update using (true);

-- ── NOTIFY ADMIN ON NEW LEAD (optional — requires pg_net or Supabase Edge Function) ──
-- You can set up a Supabase Edge Function triggered by postgres INSERT.
-- See: docs/EDGE-FUNCTIONS-SETUP.md for setup guide.

-- ═══════════════════════════════════════════════════════════════════════
-- SAMPLE BLOG POST (to test immediately after setup)
-- ═══════════════════════════════════════════════════════════════════════
insert into blog_posts (
  slug, title, excerpt, category, author, is_published, published_at, read_time,
  tags, content
) values (
  'welcome-to-gtcs-blog',
  'Welcome to the GTCS Blog — Technology for Every Business',
  'We are launching our blog with daily posts on SaaS, digital marketing, mobile apps, and free education resources for Indian businesses and students.',
  'News',
  'GTCS Team',
  true,
  now(),
  3,
  ARRAY['GTCS', 'Introduction', 'SaaS'],
  '<p>Welcome to the official GTCS blog! We are excited to share insights, tutorials, and updates from our team of engineers, marketers, and educators.</p>
<h2>What we will cover</h2>
<ul>
<li>SaaS product updates and tutorials</li>
<li>Digital marketing tips for Indian businesses</li>
<li>Mobile and desktop app development guides</li>
<li>Free education resources and study materials</li>
<li>Success stories from our clients</li>
</ul>
<p>Subscribe to our newsletter to get daily posts delivered to your inbox at 7 AM every morning.</p>'
) on conflict (slug) do nothing;
