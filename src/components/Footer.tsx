import Link from 'next/link'
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react'

const SERVICES = [
  { label: 'HospiFlow SaaS', href: '/pricing' },
  { label: 'Digital Marketing', href: '/services#digital-marketing' },
  { label: 'Mobile App Dev', href: '/services#mobile-apps' },
  { label: 'Desktop App Dev', href: '/services#desktop-apps' },
  { label: 'Web Development', href: '/services#web-dev' },
  { label: 'IT Consulting', href: '/services#consulting' },
]

const COMPANY = [
  { label: 'About Us', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Education', href: '/education' },
  { label: 'Contact', href: '/contact' },
  { label: 'Pricing', href: '/pricing' },
]

const SOCIALS = [
  { Icon: Linkedin, href: '#', label: 'LinkedIn' },
  { Icon: Twitter, href: '#', label: 'Twitter' },
  { Icon: Instagram, href: '#', label: 'Instagram' },
  { Icon: Facebook, href: '#', label: 'Facebook' },
  { Icon: Youtube, href: '#', label: 'YouTube' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-bg-card border-t border-primary/10 mt-20">
      {/* CTA strip */}
      <div className="bg-gradient-to-r from-primary-dark via-primary to-primary-dark py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Ready to grow your business with GTCS?
          </h2>
          <p className="text-white/70 mb-6">Get a free consultation today. No obligation, no pressure.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919876543210'}?text=Hi%20GTCS%2C%20I%20want%20a%20free%20consultation!`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#20b557] transition-all"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp Free Consultation
            </a>
            <Link href="/contact" className="btn-outline text-sm">
              Send an Enquiry
            </Link>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <span className="text-white font-black text-[13px] tracking-tighter">GT</span>
            </div>
            <div>
              <div className="font-black text-white text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>GTCS</div>
              <div className="text-[9px] text-primary-light/70 tracking-widest uppercase">Gentech Consultancy</div>
            </div>
          </div>
          <p className="text-white/40 text-sm leading-relaxed mb-5">
            Empowering businesses with cutting-edge technology. From SaaS to mobile apps — we build solutions that scale.
          </p>
          {/* Socials */}
          <div className="flex gap-3">
            {SOCIALS.map(({ Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                className="w-8 h-8 glass rounded-lg flex items-center justify-center text-white/40 hover:text-primary-light hover:border-primary/30 transition-all">
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>

        {/* Services */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">Services</h4>
          <ul className="space-y-2.5">
            {SERVICES.map(({ label, href }) => (
              <li key={label}>
                <Link href={href} className="text-white/45 hover:text-white text-sm transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">Company</h4>
          <ul className="space-y-2.5">
            {COMPANY.map(({ label, href }) => (
              <li key={label}>
                <Link href={href} className="text-white/45 hover:text-white text-sm transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">Contact</h4>
          <ul className="space-y-3">
            <li>
              <a href={`tel:${process.env.NEXT_PUBLIC_PHONE || '+919876543210'}`}
                className="flex items-center gap-2 text-white/45 hover:text-white text-sm transition-colors">
                <Phone size={13} className="text-primary flex-shrink-0" />
                {process.env.NEXT_PUBLIC_PHONE || '+91 98765 43210'}
              </a>
            </li>
            <li>
              <a href={`mailto:${process.env.NEXT_PUBLIC_EMAIL || 'hello@gentechcs.in'}`}
                className="flex items-center gap-2 text-white/45 hover:text-white text-sm transition-colors">
                <Mail size={13} className="text-primary flex-shrink-0" />
                {process.env.NEXT_PUBLIC_EMAIL || 'hello@gentechcs.in'}
              </a>
            </li>
            <li className="flex items-start gap-2 text-white/40 text-sm">
              <MapPin size={13} className="text-primary flex-shrink-0 mt-0.5" />
              India
            </li>
          </ul>
          <div className="mt-5">
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919876543210'}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#25D366] text-sm font-semibold hover:underline"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5 px-4 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-white/25 text-xs">
          <p>© {year} Gentech Consultancy Services (GTCS). All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white/50 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white/50 transition-colors">Terms of Service</Link>
            <Link href="/refund" className="hover:text-white/50 transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
