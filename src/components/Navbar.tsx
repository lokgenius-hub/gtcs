'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Education', href: '/education' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: '⬇ Download App', href: '/download' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-bg-deep/95 backdrop-blur-xl border-b border-primary/10 shadow-xl' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg group-hover:shadow-primary/40 transition-all">
            <span className="text-white font-black text-[13px] tracking-tighter">GT</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-black text-white text-base tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>GTCS</span>
            <span className="text-[9px] text-primary-light/70 tracking-[0.15em] uppercase">Gentech Consultancy</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                pathname === href
                  ? 'text-white bg-primary/15 border border-primary/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/portal"
            className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-all"
          >
            🌐 Online POS
          </Link>
          <Link
            href="/download"
            className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-lg bg-[#FF6600] hover:bg-[#E55A00] text-white transition-all shadow-lg shadow-orange-500/20"
          >
            ⬇ Download
          </Link>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919876543210'}?text=Hi%20GTCS%2C%20I%20want%20to%20get%20started!`}
            target="_blank" rel="noopener noreferrer"
            className="btn-primary text-sm py-2 px-4"
          >
            Get Started
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-bg-card/98 backdrop-blur-xl border-t border-primary/10 px-4 py-4 animate-slide-up">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === href
                    ? 'text-white bg-primary/15 border border-primary/25'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/portal"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-xl bg-white/10 border border-white/15 text-white transition-all"
            >
              🌐 Online POS (Browser)
            </Link>
            <Link
              href="/download"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-xl bg-[#FF6600] hover:bg-[#E55A00] text-white transition-all"
            >
              ⬇ Download App
            </Link>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919876543210'}?text=Hi!`}
              target="_blank" rel="noopener noreferrer"
              className="mt-2 btn-primary text-sm justify-center"
              onClick={() => setOpen(false)}
            >
              Get Started on WhatsApp
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
