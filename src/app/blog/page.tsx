'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { getBlogPosts, type BlogPost, subscribeNewsletter } from '@/lib/supabase'
import { Search, Clock, Mail, CheckCircle } from 'lucide-react'

const CATEGORIES = ['All', 'SaaS & Tech', 'Digital Marketing', 'Education', 'Business', 'Tutorial', 'News']

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [filtered, setFiltered] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [email, setEmail] = useState('')
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  useEffect(() => {
    getBlogPosts()
      .then(data => { setPosts(data); setFiltered(data) })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let result = posts
    if (activeCategory !== 'All') {
      result = result.filter(p => p.category === activeCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.excerpt || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [search, activeCategory, posts])

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubStatus('loading')
    try {
      await subscribeNewsletter(email)
      setSubStatus('success')
      setEmail('')
    } catch {
      setSubStatus('error')
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-16">

        {/* HERO */}
        <section className="py-20 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(0,102,204,0.15),transparent)]" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <p className="section-label mb-3">GTCS Blog</p>
            <h1 className="section-title mb-4">Insights, tutorials & business tips</h1>
            <p className="section-sub mx-auto mb-8">
              Daily posts on SaaS, digital marketing, tech education, and growth strategies for Indian businesses.
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all"
              />
            </div>
          </div>
        </section>

        {/* CATEGORY FILTER */}
        <div className="px-4 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-primary text-white border border-primary'
                      : 'glass text-white/50 hover:text-white hover:border-primary/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* POSTS GRID */}
        <section className="pb-16 px-4">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="spinner" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-white/50 font-semibold mb-2">
                  {posts.length === 0 ? 'Blog posts coming soon' : 'No results found'}
                </h3>
                <p className="text-white/25 text-sm">
                  {posts.length === 0
                    ? 'Subscribe below to get notified when we publish our first article!'
                    : 'Try a different search term or category.'}
                </p>
              </div>
            ) : (
              <>
                {/* Featured post (first) */}
                {filtered.length > 0 && (
                  <Link href={`/blog/${filtered[0].slug}`} className="group block mb-8">
                    <div className="glass rounded-3xl overflow-hidden hover:border-primary/30 transition-all hover:-translate-y-0.5">
                      <div className="grid lg:grid-cols-2 gap-0">
                        <div className="aspect-video lg:aspect-auto min-h-[240px] bg-gradient-to-br from-primary/20 to-accent/10 relative flex items-center justify-center">
                          {filtered[0].cover_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={filtered[0].cover_image} alt={filtered[0].title} className="object-cover w-full h-full" />
                          ) : (
                            <span className="text-6xl">📰</span>
                          )}
                        </div>
                        <div className="p-8 flex flex-col justify-center">
                          <span className="chip mb-3">{filtered[0].category || 'Article'}</span>
                          <h2 className="text-white font-black text-2xl mb-3 leading-tight group-hover:text-primary-light transition-colors" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            {filtered[0].title}
                          </h2>
                          {filtered[0].excerpt && (
                            <p className="text-white/45 text-sm leading-relaxed mb-4 line-clamp-3">{filtered[0].excerpt}</p>
                          )}
                          <div className="flex items-center gap-4 text-white/30 text-xs">
                            {filtered[0].author && <span>{filtered[0].author}</span>}
                            {filtered[0].read_time && (
                              <span className="flex items-center gap-1"><Clock size={10} /> {filtered[0].read_time} min read</span>
                            )}
                            <span>{new Date(filtered[0].published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Rest of posts */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.slice(1).map(post => (
                    <Link key={post.id} href={`/blog/${post.slug}`} className="group glass rounded-2xl overflow-hidden hover:border-primary/25 transition-all hover:-translate-y-0.5 flex flex-col">
                      <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/5 relative flex items-center justify-center overflow-hidden">
                        {post.cover_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={post.cover_image} alt={post.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <span className="text-4xl">📰</span>
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        {post.category && <span className="chip mb-2 inline-block self-start">{post.category}</span>}
                        <h3 className="text-white font-bold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary-light transition-colors flex-1">
                          {post.title}
                        </h3>
                        {post.excerpt && <p className="text-white/35 text-xs line-clamp-2 mb-3">{post.excerpt}</p>}
                        <div className="flex items-center justify-between text-white/25 text-xs mt-auto">
                          <span>{new Date(post.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          {post.read_time && <span className="flex items-center gap-1"><Clock size={10} /> {post.read_time}m</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* NEWSLETTER */}
        <section className="py-16 px-4 bg-bg-card/50">
          <div className="max-w-xl mx-auto glass rounded-3xl p-8 text-center gradient-border">
            <Mail size={28} className="mx-auto mb-4 text-primary-light" />
            <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Get posts in your inbox
            </h2>
            <p className="text-white/45 text-sm mb-6">
              Daily insights on SaaS, marketing, and tech — delivered at 7 AM. No spam, ever.
            </p>

            {subStatus === 'success' ? (
              <div className="flex items-center justify-center gap-2 text-green-400">
                <CheckCircle size={18} />
                <span className="font-semibold">You&apos;re subscribed! Check your inbox.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-primary/50 transition-all"
                />
                <button type="submit" disabled={subStatus === 'loading'} className="btn-primary text-sm py-3 px-5 disabled:opacity-50">
                  {subStatus === 'loading' ? '...' : <><Mail size={14} /> Subscribe</>}
                </button>
              </form>
            )}
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
