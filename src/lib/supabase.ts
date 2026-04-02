/**
 * Supabase public client — anon key only, safe in browser.
 * Used for: blog posts (read) + contact form submissions (insert).
 * RLS must be enabled on all tables.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
})

const TENANT = process.env.NEXT_PUBLIC_TENANT_ID || 'gtcs'

// ──────────────────────────────────────────────────────────────
// BLOG
// ──────────────────────────────────────────────────────────────

export type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt?: string | null
  cover_image?: string | null
  category?: string | null
  content?: string | null
  author?: string | null
  author_avatar?: string | null
  published_at: string
  tags?: string[] | null
  read_time?: number | null
}

/** All published posts, newest first */
export async function getBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id,slug,title,excerpt,cover_image,category,author,published_at,tags,read_time')
    .eq('tenant_id', TENANT)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
  if (error) console.error('[Blog] fetch error', error)
  return data ?? []
}

/** Single post by slug */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('tenant_id', TENANT)
    .eq('is_published', true)
    .eq('slug', slug)
    .single()
  return data ?? null
}

/** Posts by category */
export async function getBlogPostsByCategory(category: string): Promise<BlogPost[]> {
  const { data } = await supabase
    .from('blog_posts')
    .select('id,slug,title,excerpt,cover_image,category,author,published_at,tags,read_time')
    .eq('tenant_id', TENANT)
    .eq('is_published', true)
    .eq('category', category)
    .order('published_at', { ascending: false })
  return data ?? []
}

// ──────────────────────────────────────────────────────────────
// CONTACT / LEAD
// ──────────────────────────────────────────────────────────────

export type LeadData = {
  name: string
  phone: string
  email?: string
  service_interest?: string
  message?: string
  source?: string
}

/** Submit a contact / lead form */
export async function submitLead(lead: LeadData): Promise<void> {
  const { error } = await supabase.from('leads').insert([{
    ...lead,
    tenant_id: TENANT,
    created_at: new Date().toISOString(),
  }])
  if (error) throw new Error(error.message)
}

// ──────────────────────────────────────────────────────────────
// NEWSLETTER SUBSCRIBERS
// ──────────────────────────────────────────────────────────────

export async function subscribeNewsletter(email: string): Promise<void> {
  const { error } = await supabase.from('newsletter_subscribers').upsert(
    [{ email: email.toLowerCase().trim(), tenant_id: TENANT, subscribed_at: new Date().toISOString() }],
    { onConflict: 'email' }
  )
  if (error && !error.message.includes('duplicate')) throw new Error(error.message)
}
