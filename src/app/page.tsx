import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import {
  ArrowRight, CheckCircle, Star, Zap, Shield, Globe, Smartphone, Monitor,
  TrendingUp, GraduationCap, Server, BarChart3, Users, Award, Clock, HeadphonesIcon
} from 'lucide-react'

// ── Stat counters ──────────────────────────────────────────────────────────
const STATS = [
  { value: '200+', label: 'Clients Served', icon: Users },
  { value: '50+', label: 'Products Deployed', icon: Server },
  { value: '5+', label: 'Years Experience', icon: Award },
  { value: '24/7', label: 'Support Available', icon: HeadphonesIcon },
]

// ── Services overview ──────────────────────────────────────────────────────
const SERVICES = [
  {
    icon: Server,
    color: '#0066CC',
    title: 'SaaS Products',
    description: 'Production-ready SaaS software — POS, Hotel Management, Loyalty System, QR Menu — subscribe and go live in minutes.',
    cta: 'View Pricing',
    href: '/pricing',
  },
  {
    icon: TrendingUp,
    color: '#FF6600',
    title: 'Digital Marketing',
    description: 'SEO, Google Ads, Meta Ads, social media management, content strategy, and performance analytics that drive real ROI.',
    cta: 'Learn More',
    href: '/services#digital-marketing',
  },
  {
    icon: Smartphone,
    color: '#8B5CF6',
    title: 'Mobile App Dev',
    description: 'React Native & Flutter cross-platform apps for Android and iOS. From prototype to Play Store / App Store in weeks.',
    cta: 'See Our Work',
    href: '/services#mobile-apps',
  },
  {
    icon: Monitor,
    color: '#10B981',
    title: 'Desktop App Dev',
    description: 'Electron-based Windows/Mac/Linux desktop applications — offline-capable, hardware integrations, POS terminals.',
    cta: 'Learn More',
    href: '/services#desktop-apps',
  },
  {
    icon: Globe,
    color: '#0EA5E9',
    title: 'Web Development',
    description: 'High-performance websites & web apps with Next.js, React, and modern stacks. SEO-optimised and lightning fast.',
    cta: 'Learn More',
    href: '/services#web-dev',
  },
  {
    icon: GraduationCap,
    color: '#F59E0B',
    title: 'Free Education',
    description: 'Completely free coaching for Class 10–12, competitive exams, and tech skills. No fees, no strings attached.',
    cta: 'Enroll Free',
    href: '/education',
  },
]

// ── HospiFlow highlights ───────────────────────────────────────────────────
const HOSPIFLOW_FEATURES = [
  'POS Billing with KOT & table management',
  'QR self-ordering (no app download needed)',
  'Loyalty / Coin reward system',
  'Hotel & room booking management',
  'Inventory with low-stock alerts',
  'Staff attendance & salary',
  'GST-ready reports & analytics',
  '14-day free trial — no credit card',
]

// ── Why GTCS ───────────────────────────────────────────────────────────────
const WHY = [
  { icon: Zap, title: 'Fast Delivery', desc: 'Most projects go live in 2–4 weeks, not months.' },
  { icon: Shield, title: 'Enterprise Security', desc: 'End-to-end encryption, RLS, JWT auth, SOC2-level practices.' },
  { icon: BarChart3, title: 'Data-Driven', desc: 'Real-time dashboards & analytics built into every product.' },
  { icon: HeadphonesIcon, title: '24/7 Support', desc: 'Dedicated support channel — WhatsApp, email, or call.' },
  { icon: Users, title: 'Indian-Made', desc: 'Proud to build for Bharat — GST-ready, regional language support.' },
  { icon: Clock, title: 'Pay As You Grow', desc: 'Flexible yearly/lifetime pricing. No surprise bills.' },
]

// ── Testimonials ── ────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: 'Rahul Sharma',
    role: 'Owner, Spice Garden Restaurant',
    rating: 5,
    text: 'HospiFlow transformed our billing process. The QR ordering cut our wait staff time by 40% and customers love it!',
  },
  {
    name: 'Priya Mehta',
    role: 'Manager, Grand Stay Hotel',
    rating: 5,
    text: 'The hotel module is incredibly feature-rich. Check-in, check-out, room service — everything in one screen. Best investment.',
  },
  {
    name: 'Amit Kumar',
    role: 'Director, TechServe Solutions',
    rating: 5,
    text: 'GTCS built our customer-facing app in just 3 weeks. Clean code, proper documentation, and excellent after-sales support.',
  },
]

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>

        {/* ───── HERO ───── */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 grid-bg" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,102,204,0.25),transparent)]" />
          <div className="absolute top-0 left-0 right-0 h-px hero-line" />

          {/* Animated blobs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-float pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float [animation-delay:3s] pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 pt-24 pb-16 grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 text-xs">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white/60">Now serving 200+ businesses across India</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.05] mb-5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Technology that{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light">
                  scales
                </span>{' '}
                with you.
              </h1>

              <p className="text-white/55 text-lg lg:text-xl leading-relaxed mb-8 max-w-lg">
                GTCS builds SaaS products, mobile apps, desktop apps and digital marketing strategies for growing businesses across India.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link href="/pricing" className="btn-primary">
                  Explore SaaS Products <ArrowRight size={16} />
                </Link>
                <Link href="/contact" className="btn-outline">
                  Free Consultation
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4">
                {['GST Ready', 'Made in India', '14-Day Free Trial', '24/7 Support'].map(b => (
                  <span key={b} className="flex items-center gap-1.5 text-white/40 text-xs">
                    <CheckCircle size={12} className="text-primary" />
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — feature card */}
            <div className="hidden lg:block animate-slide-up">
              <div className="glass rounded-3xl p-6 gradient-border">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
                    <Server size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold">HospiFlow SaaS</div>
                    <div className="text-white/40 text-xs">Restaurant · Hotel · POS</div>
                  </div>
                  <div className="ml-auto chip">🔥 Popular</div>
                </div>

                {/* Module tiles */}
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {[
                    { emoji: '🧾', label: 'POS' },
                    { emoji: '📲', label: 'QR Menu' },
                    { emoji: '🪙', label: 'Loyalty' },
                    { emoji: '🏨', label: 'Hotel' },
                    { emoji: '📦', label: 'Inventory' },
                    { emoji: '👥', label: 'Staff' },
                    { emoji: '📊', label: 'Reports' },
                    { emoji: '🍽️', label: 'Restaurant' },
                  ].map(m => (
                    <div key={m.label} className="bg-white/5 rounded-xl p-2.5 text-center hover:bg-primary/10 transition-colors cursor-default">
                      <div className="text-xl mb-1">{m.emoji}</div>
                      <div className="text-white/50 text-[10px]">{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Pricing teaser */}
                <div className="bg-primary/10 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <div className="text-white/50 text-xs">Starting from</div>
                    <div className="text-white font-bold text-2xl">₹5,999 <span className="text-sm font-normal text-white/40">/year</span></div>
                    <div className="text-white/30 text-[10px]">All prices + 18% GST • 14-day free trial</div>
                  </div>
                  <Link href="/pricing" className="btn-primary text-sm py-2">
                    See Plans →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───── STATS ───── */}
        <section className="py-16 px-4 border-y border-white/5">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="counter-card">
                <Icon size={24} className="mx-auto mb-3 text-primary" />
                <div className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{value}</div>
                <div className="text-white/40 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ───── SERVICES ───── */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <p className="section-label mb-2">What We Offer</p>
              <h2 className="section-title mb-4">End-to-end technology services</h2>
              <p className="section-sub mx-auto text-center">
                From ready-to-deploy SaaS to custom software development — everything a growing business needs under one roof.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {SERVICES.map(({ icon: Icon, color, title, description, cta, href }) => (
                <Link key={title} href={href} className="glass rounded-2xl p-6 group hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 flex flex-col">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed flex-1 mb-4">{description}</p>
                  <div className="flex items-center gap-1 text-sm font-semibold transition-colors" style={{ color }}>
                    {cta} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ───── HOSPIFLOW DEEP DIVE ───── */}
        <section className="py-20 px-4 bg-bg-card/50">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <p className="section-label mb-3">Featured Product</p>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                HospiFlow — Complete business management
              </h2>
              <p className="text-white/50 leading-relaxed mb-6">
                A multi-tenant SaaS platform purpose-built for hotels, restaurants, and cafes.
                Subscribe to individual modules or get the full suite — deployed on your account in minutes.
              </p>
              <ul className="space-y-2.5 mb-8">
                {HOSPIFLOW_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-white/70 text-sm">
                    <CheckCircle size={14} className="text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="flex gap-3">
                <Link href="/pricing" className="btn-primary">
                  View All Plans <ArrowRight size={16} />
                </Link>
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919876543210'}?text=Hi!%20I%20want%20to%20try%20HospiFlow.`}
                  target="_blank" rel="noopener noreferrer"
                  className="btn-outline"
                >
                  Request Demo
                </a>
              </div>
            </div>

            {/* Pricing cards preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: 'Starter', desc: 'POS + QR Menu', price: '₹5,999', period: '/year', color: '#6366f1', tag: '' },
                { name: 'Professional', desc: '5 modules', price: '₹11,999', period: '/year', color: '#0EA5E9', tag: '🔥 Popular' },
                { name: 'Enterprise', desc: 'All modules (1 branch)', price: '₹21,999', period: '/year', color: '#10B981', tag: '' },
                { name: 'Lifetime', desc: 'Enterprise Plus', price: '₹1,49,999', period: ' lifetime', color: '#F59E0B', tag: '💎 Best Value' },
              ].map(plan => (
                <div key={plan.name} className="glass rounded-2xl p-5 hover:border-primary/30 transition-all hover:-translate-y-0.5">
                  {plan.tag && <div className="text-xs font-semibold mb-2" style={{ color: plan.color }}>{plan.tag}</div>}
                  <div className="text-white font-bold text-base mb-0.5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{plan.name}</div>
                  <div className="text-white/40 text-xs mb-3">{plan.desc}</div>
                  <div className="text-white font-black text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {plan.price}
                    <span className="text-white/35 text-sm font-normal">{plan.period}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── WHY GTCS ───── */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <p className="section-label mb-2">Why Choose Us</p>
              <h2 className="section-title mb-4">Built different. Built better.</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {WHY.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="glass rounded-2xl p-6 hover:border-primary/25 transition-colors">
                  <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center mb-4">
                    <Icon size={20} className="text-primary-light" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── TESTIMONIALS ───── */}
        <section className="py-20 px-4 bg-bg-card/40">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <p className="section-label mb-2">Client Stories</p>
              <h2 className="section-title">Trusted by businesses across India</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map(({ name, role, rating, text }) => (
                <div key={name} className="glass rounded-2xl p-6 flex flex-col">
                  <div className="flex mb-3">
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-white/65 text-sm leading-relaxed flex-1 mb-4 italic">&ldquo;{text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {name[0]}
                    </div>
                    <div>
                      <div className="text-white text-sm font-semibold">{name}</div>
                      <div className="text-white/35 text-xs">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── EDUCATION CALLOUT ───── */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto glass rounded-3xl p-10 text-center gradient-border">
            <div className="w-14 h-14 bg-yellow-500/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <GraduationCap size={28} className="text-yellow-400" />
            </div>
            <p className="section-label mb-3">Free Education Initiative</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              100% Free Coaching for Students
            </h2>
            <p className="text-white/50 text-lg leading-relaxed mb-7 max-w-xl mx-auto">
              GTCS believes education should be free. We offer free coaching for Class 10 & 12, competitive exams (JEE, NEET, UPSC), and practical tech skills (coding, design, digital marketing).
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/education" className="btn-accent">
                Explore Free Courses <ArrowRight size={16} />
              </Link>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919876543210'}?text=Hi!%20I%20want%20to%20enroll%20in%20free%20coaching.`}
                target="_blank" rel="noopener noreferrer"
                className="btn-outline"
              >
                Enroll via WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* ───── BLOG SNIPPET ───── */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="section-label mb-1">Latest Insights</p>
                <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>From our blog</h2>
              </div>
              <Link href="/blog" className="text-primary-light text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                All Posts <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { cat: 'SaaS', title: 'How to increase restaurant revenue 30% with QR ordering', date: 'Jan 15, 2026' },
                { cat: 'Marketing', title: 'Google Ads vs Meta Ads: Which works better for local businesses?', date: 'Jan 10, 2026' },
                { cat: 'Education', title: 'Free JEE preparation resources — our complete guide for 2026', date: 'Jan 5, 2026' },
              ].map(post => (
                <Link key={post.title} href="/blog" className="glass rounded-2xl p-5 hover:border-primary/25 transition-all hover:-translate-y-0.5 group">
                  <span className="chip mb-3 inline-block">{post.cat}</span>
                  <h3 className="text-white font-semibold text-sm leading-snug mb-3 group-hover:text-primary-light transition-colors">{post.title}</h3>
                  <p className="text-white/25 text-xs">{post.date}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
