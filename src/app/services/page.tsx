import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import {
  ArrowRight, CheckCircle, TrendingUp, Smartphone, Monitor, Globe,
  Search, Share2, Mail, BarChart3, Layers, Code2, Cpu, Wifi, Database
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Services',
  description: 'GTCS offers SaaS products, digital marketing, mobile app development, desktop apps, and web development services.',
}

const DIGITAL_MARKETING = [
  { icon: Search, title: 'SEO & Content', desc: 'Ranking-focused content strategy, technical SEO audits, backlink building and local SEO for Google Maps visibility.' },
  { icon: TrendingUp, title: 'Google Ads (PPC)', desc: 'ROAS-optimised campaigns on Search, Display, Shopping, and YouTube Ads with full conversion tracking.' },
  { icon: Share2, title: 'Social Media Marketing', desc: 'Meta, Instagram, LinkedIn, and YouTube ads. Organic content calendars that build loyal communities.' },
  { icon: Mail, title: 'Email & WhatsApp Marketing', desc: 'Automated drip campaigns, broadcast messages, and WhatsApp Business API integrations for high open rates.' },
  { icon: BarChart3, title: 'Analytics & Reporting', desc: 'Google Analytics 4, Search Console, Meta Insights — weekly reports in plain English with clear ROI numbers.' },
  { icon: Layers, title: 'Branding & Creatives', desc: 'Logo, brand kit, ad creatives, social posts, reels, and video editing — all in-house.' },
]

const MOBILE_FEATURES = [
  'React Native & Flutter (iOS + Android from one codebase)',
  'Offline-first architecture',
  'Push notifications (Firebase)',
  'Payment gateway integration (Razorpay, PhonePe, Stripe)',
  'Google Maps & location services',
  'Biometric authentication',
  'Play Store & App Store submission',
  'Crash reporting & analytics',
]

const DESKTOP_FEATURES = [
  'Electron.js (Windows, Mac, Linux from one codebase)',
  'Offline/local database (SQLite, LevelDB)',
  'Serial port / USB hardware integration',
  'Thermal printer support (ESC/POS)',
  'Auto-update mechanism',
  'Windows installer (NSIS / Squirrel)',
  'Multi-monitor support',
  'Kiosk / fullscreen mode',
]

const WEB_STACK = [
  { name: 'Next.js 15', color: '#fff', desc: 'SSR/ISR/SSG for blazing speed + SEO' },
  { name: 'React', color: '#61DAFB', desc: 'Component-driven UI' },
  { name: 'Supabase', color: '#3ECF8E', desc: 'PostgreSQL + Auth + Realtime' },
  { name: 'Tailwind CSS', color: '#38BDF8', desc: 'Utility-first styling' },
  { name: 'TypeScript', color: '#3178C6', desc: 'Type-safe everywhere' },
  { name: 'Vercel / Render', color: '#FF6600', desc: 'Auto-deploy on push' },
]

const PROCESS = [
  { step: '01', title: 'Discovery Call', desc: 'Free 30-min call to understand your requirements, timelines, and budget.' },
  { step: '02', title: 'Proposal & Design', desc: 'We share wireframes, tech stack, timeline, and fixed-price quote within 48 hours.' },
  { step: '03', title: 'Build & Iterate', desc: 'Agile sprints with weekly demos. You see progress, not just promises.' },
  { step: '04', title: 'Launch & Support', desc: 'Go-live deployment + 3-month free support. Then flexible AMC plans.' },
]

export default function ServicesPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">

        {/* HERO */}
        <section className="relative py-24 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-50" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(0,102,204,0.2),transparent)]" />
          <div className="relative z-10 max-w-4xl mx-auto">
            <p className="section-label mb-3">Our Services</p>
            <h1 className="section-title mb-5">
              Everything your business needs to thrive online
            </h1>
            <p className="section-sub mx-auto mb-8">
              From SaaS products you can subscribe to today, to custom-built software designed exactly for your workflow — GTCS does it all.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/contact" className="btn-primary">Get Free Consultation <ArrowRight size={16} /></Link>
              <Link href="/pricing" className="btn-outline">SaaS Pricing →</Link>
            </div>
          </div>
        </section>

        {/* ── DIGITAL MARKETING ── */}
        <section id="digital-marketing" className="py-20 px-4 scroll-mt-16">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,102,0,0.15)', border: '1px solid rgba(255,102,0,0.3)' }}>
                  <TrendingUp size={20} style={{ color: '#FF6600' }} />
                </div>
                <span className="text-accent font-semibold text-sm uppercase tracking-widest">Service 01</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Digital Marketing
              </h2>
              <p className="text-white/50 max-w-2xl leading-relaxed">
                Data-driven marketing that turns clicks into customers. We run performance campaigns across every major platform with transparent reporting.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
              {DIGITAL_MARKETING.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="glass rounded-2xl p-6 hover:border-accent/25 transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,102,0,0.1)', border: '1px solid rgba(255,102,0,0.2)' }}>
                    <Icon size={18} style={{ color: '#FF8533' }} />
                  </div>
                  <h3 className="text-white font-semibold mb-1.5">{title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <Link href="/contact" className="btn-accent">Get a Marketing Audit <ArrowRight size={16} /></Link>
          </div>
        </section>

        {/* ── MOBILE APPS ── */}
        <section id="mobile-apps" className="py-20 px-4 bg-bg-card/40 scroll-mt-16">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
                  <Smartphone size={20} style={{ color: '#A78BFA' }} />
                </div>
                <span className="text-purple-400 font-semibold text-sm uppercase tracking-widest">Service 02</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Mobile App Development
              </h2>
              <p className="text-white/50 leading-relaxed mb-6">
                Cross-platform apps that feel native. We build production-grade iOS and Android applications using React Native and Flutter.
              </p>
              <ul className="space-y-2.5">
                {MOBILE_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-white/65 text-sm">
                    <CheckCircle size={13} className="text-purple-400 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/contact" className="btn-primary">
                  Discuss Your App Idea <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 gradient-border">
              <div className="text-center mb-6">
                <Smartphone size={48} className="mx-auto mb-3 text-purple-400" />
                <div className="text-white font-bold text-lg">Typical Delivery Timeline</div>
              </div>
              <div className="space-y-3">
                {[
                  { phase: 'Discovery & Design', duration: '1–2 weeks', color: '#8B5CF6' },
                  { phase: 'Core development', duration: '4–6 weeks', color: '#A78BFA' },
                  { phase: 'Testing & QA', duration: '1–2 weeks', color: '#C4B5FD' },
                  { phase: 'Store review & launch', duration: '1 week', color: '#DDD6FE' },
                ].map(p => (
                  <div key={p.phase} className="flex justify-between items-center bg-white/3 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                      <span className="text-white/70 text-sm">{p.phase}</span>
                    </div>
                    <span className="text-white/40 text-xs">{p.duration}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-purple-500/10 rounded-xl text-center">
                <span className="text-purple-300 text-sm font-semibold">Total: 7–11 weeks from kick-off to store launch</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── DESKTOP APPS ── */}
        <section id="desktop-apps" className="py-20 px-4 scroll-mt-16">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 glass rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/8">
                <Cpu size={20} className="text-green-400" />
                <span className="text-white font-semibold">Desktop App Capabilities</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Wifi, label: 'Works offline', color: 'text-green-400' },
                  { icon: Database, label: 'Local database', color: 'text-blue-400' },
                  { icon: Cpu, label: 'Hardware I/O', color: 'text-yellow-400' },
                  { icon: Code2, label: 'Auto updates', color: 'text-purple-400' },
                ].map(c => (
                  <div key={c.label} className="bg-white/4 rounded-xl p-4 flex items-center gap-2.5">
                    <c.icon size={16} className={c.color} />
                    <span className="text-white/65 text-sm">{c.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-green-500/8 border border-green-500/20 rounded-xl">
                <div className="text-green-400 text-sm font-semibold mb-1">✓ HospiFlow POS is built this way</div>
                <div className="text-white/40 text-xs">Works without internet, syncs when online — perfect for restaurants and hotels.</div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <Monitor size={20} style={{ color: '#34D399' }} />
                </div>
                <span className="text-emerald-400 font-semibold text-sm uppercase tracking-widest">Service 03</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Desktop App Development
              </h2>
              <p className="text-white/50 leading-relaxed mb-6">
                Electron-based desktop apps that look beautiful, work offline, and integrate with hardware like printers, barcode scanners, and biometric devices.
              </p>
              <ul className="space-y-2.5">
                {DESKTOP_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-white/65 text-sm">
                    <CheckCircle size={13} className="text-green-400 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/contact" className="btn-primary">
                  Discuss Your Desktop App <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── WEB DEV ── */}
        <section id="web-dev" className="py-20 px-4 bg-bg-card/40 scroll-mt-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 justify-center mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)' }}>
                  <Globe size={20} style={{ color: '#38BDF8' }} />
                </div>
                <span className="text-sky-400 font-semibold text-sm uppercase tracking-widest">Service 04</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Web Development</h2>
              <p className="text-white/50 max-w-xl mx-auto">Performance-obsessed websites and web applications. Built to rank on Google, load in under 2 seconds, and convert visitors into customers.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
              {WEB_STACK.map(({ name, color, desc }) => (
                <div key={name} className="glass rounded-2xl p-4 hover:border-sky-500/25 transition-colors">
                  <div className="font-bold mb-1" style={{ color, fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>{name}</div>
                  <div className="text-white/40 text-xs">{desc}</div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link href="/contact" className="btn-primary">Start Your Web Project <ArrowRight size={16} /></Link>
            </div>
          </div>
        </section>

        {/* ── PROCESS ── */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="section-label mb-2">How We Work</p>
              <h2 className="section-title">Simple, transparent process</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {PROCESS.map(({ step, title, desc }, i) => (
                <div key={step} className="relative">
                  {i < PROCESS.length - 1 && (
                    <div className="hidden lg:block absolute top-6 left-full w-full h-px border-t border-dashed border-primary/20 z-0" />
                  )}
                  <div className="glass rounded-2xl p-5 relative z-10">
                    <div className="w-10 h-10 bg-primary/15 border border-primary/30 rounded-xl flex items-center justify-center text-primary font-black text-sm mb-4">
                      {step}
                    </div>
                    <h3 className="text-white font-semibold mb-1.5">{title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Ready to get started?</h2>
            <p className="text-white/45 mb-6">Free consultation call — no commitment needed.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/contact" className="btn-primary">Book Free Call <ArrowRight size={16} /></Link>
              <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919876543210'}`} target="_blank" rel="noopener noreferrer" className="btn-accent">WhatsApp Now</a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
