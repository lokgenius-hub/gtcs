import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { getBlogPost, getBlogPosts } from '@/lib/supabase'
import { ArrowLeft, Clock, Calendar, Tag } from 'lucide-react'

export async function generateStaticParams() {
  try {
    const posts = await getBlogPosts()
    const slugs = posts.map((p) => ({ slug: p.slug }))
    return slugs.length > 0 ? slugs : [{ slug: '_' }]
  } catch {
    return [{ slug: '_' }]  // placeholder so build succeeds without Supabase
  }
}

export const dynamicParams = false

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (slug === '_') return { title: 'Post Not Found' }
  const post = await getBlogPost(slug)
  if (!post) return { title: 'Post Not Found' }
  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      images: post.cover_image ? [post.cover_image] : [],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  if (slug === '_') notFound()
  const post = await getBlogPost(slug)
  if (!post) notFound()

  return (
    <>
      <Navbar />
      <main className="pt-16">

        {/* HEADER */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <Link href="/blog" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors">
              <ArrowLeft size={14} /> Back to Blog
            </Link>

            {post.category && (
              <span className="chip mb-4 inline-block">{post.category}</span>
            )}

            <h1 className="text-3xl md:text-5xl font-black text-white mb-5 leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-white/50 text-lg leading-relaxed mb-6">{post.excerpt}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-white/30 text-sm mb-8 pb-8 border-b border-white/8">
              {post.author && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {post.author[0]}
                  </div>
                  <span className="text-white/60">{post.author}</span>
                </div>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                {new Date(post.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {post.read_time && (
                <span className="flex items-center gap-1.5">
                  <Clock size={13} /> {post.read_time} min read
                </span>
              )}
            </div>

            {post.cover_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full aspect-video object-cover rounded-2xl mb-8"
              />
            )}

            {/* Content */}
            <article
              className="prose prose-invert prose-lg max-w-none
                prose-headings:font-black prose-headings:text-white
                prose-p:text-white/65 prose-p:leading-relaxed
                prose-a:text-primary-light prose-a:no-underline hover:prose-a:underline
                prose-strong:text-white
                prose-code:text-accent-light prose-code:bg-white/5 prose-code:rounded prose-code:px-1
                prose-pre:bg-bg-elevated prose-pre:border prose-pre:border-white/10
                prose-blockquote:border-l-primary prose-blockquote:text-white/50
                prose-img:rounded-xl
                prose-li:text-white/65"
              dangerouslySetInnerHTML={{ __html: post.content || '<p>Content coming soon.</p>' }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-10 pt-8 border-t border-white/8">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag size={13} className="text-white/30" />
                  {post.tags.map(tag => (
                    <span key={tag} className="chip">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Share */}
            <div className="mt-8 glass rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-white font-semibold text-sm mb-0.5">Found this helpful?</div>
                <div className="text-white/40 text-xs">Share it with your network</div>
              </div>
              <div className="flex gap-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${post.title} — ${process.env.NEXT_PUBLIC_SITE_URL || 'https://gentechcs.in'}/blog/${post.slug}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Share on WhatsApp
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://gentechcs.in'}/blog/${post.slug}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#1DA1F2] text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Share on X
                </a>
              </div>
            </div>

            {/* Back */}
            <div className="mt-8 text-center">
              <Link href="/blog" className="btn-outline text-sm">
                ← Read More Articles
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
