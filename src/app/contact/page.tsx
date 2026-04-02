'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { submitLead } from '@/lib/supabase'
import { Phone, Mail, MapPin, MessageCircle, Send, CheckCircle, AlertCircle, Clock } from 'lucide-react'

const SERVICES = [
  'HospiFlow SaaS (POS / Hotel / QR Menu)',
  'Digital Marketing (SEO + Ads)',
  'Mobile App Development',
  'Desktop App Development',
  'Web Development',
  'IT Consulting',
  'Free Education Coaching',
  'Other / General Enquiry',
]

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', service_interest: SERVICES[0], message: ''
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) return
    setStatus('loading')
    setErrorMsg('')

    try {
      // Parallel: save to Supabase + send email via API route
      await Promise.all([
        submitLead({
          name: form.name.trim(),
          phone: form.phone.trim().replace(/\D/g, '').slice(-10),
          email: form.email.trim() || undefined,
          service_interest: form.service_interest,
          message: form.message.trim() || undefined,
          source: 'website_contact',
        }),
        fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone.trim().replace(/\D/g, '').slice(-10),
            email: form.email.trim() || undefined,
            service_interest: form.service_interest,
            message: form.message.trim() || undefined,
          }),
        }).catch(() => {}), // email failure is non-fatal
      ])
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please call or WhatsApp us directly.')
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-16">

        {/* HEADER */}
        <section className="py-16 px-4 text-center bg-gradient-to-b from-bg-card/60 to-bg-deep">
          <div className="max-w-2xl mx-auto">
            <p className="section-label mb-3">Contact Us</p>
            <h1 className="section-title mb-4">Let&apos;s build something together</h1>
            <p className="section-sub mx-auto">
              Fill the form and we&apos;ll get back within 2–4 hours. Or reach us instantly on WhatsApp.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT — Contact Info */}
          <div className="space-y-4">

            {/* WhatsApp CTA */}
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919876543210'}?text=Hi%20GTCS!%20I%20have%20an%20enquiry.`}
              target="_blank" rel="noopener noreferrer"
              className="block glass rounded-2xl p-5 hover:border-[#25D366]/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#25D366]/15 rounded-xl flex items-center justify-center group-hover:bg-[#25D366]/20 transition-colors">
                  <MessageCircle size={18} className="text-[#25D366]" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">Chat on WhatsApp</div>
                  <div className="text-white/40 text-xs">Usually replies in &lt; 30 minutes</div>
                </div>
              </div>
            </a>

            {[
              {
                icon: Phone,
                iconColor: 'text-primary-light',
                bgColor: 'bg-primary/15',
                label: 'Call Us',
                value: process.env.NEXT_PUBLIC_PHONE || '+91 98765 43210',
                href: `tel:${process.env.NEXT_PUBLIC_PHONE || '+919876543210'}`,
              },
              {
                icon: Mail,
                iconColor: 'text-accent',
                bgColor: 'bg-accent/15',
                label: 'Email Us',
                value: process.env.NEXT_PUBLIC_EMAIL || 'hello@gentechcs.in',
                href: `mailto:${process.env.NEXT_PUBLIC_EMAIL || 'hello@gentechcs.in'}`,
              },
              {
                icon: MapPin,
                iconColor: 'text-green-400',
                bgColor: 'bg-green-500/15',
                label: 'Location',
                value: 'India (Remote-first)',
                href: '#',
              },
              {
                icon: Clock,
                iconColor: 'text-yellow-400',
                bgColor: 'bg-yellow-500/15',
                label: 'Business Hours',
                value: 'Mon–Sat, 9 AM – 8 PM IST',
                href: '#',
              },
            ].map(({ icon: Icon, iconColor, bgColor, label, value, href }) => (
              <a key={label} href={href}
                className={`block glass rounded-2xl p-5 hover:border-primary/25 transition-all ${href === '#' ? 'cursor-default' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className={iconColor} />
                  </div>
                  <div>
                    <div className="text-white/40 text-xs">{label}</div>
                    <div className="text-white text-sm font-medium">{value}</div>
                  </div>
                </div>
              </a>
            ))}

            {/* Response guarantee */}
            <div className="glass rounded-2xl p-5 border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={14} className="text-green-400" />
                <span className="text-white font-semibold text-sm">Response Guarantee</span>
              </div>
              <p className="text-white/40 text-xs leading-relaxed">
                We respond to every enquiry within 2–4 business hours. For urgent requests, please WhatsApp us for an immediate response.
              </p>
            </div>
          </div>

          {/* RIGHT — Form */}
          <div className="lg:col-span-2">
            {status === 'success' ? (
              <div className="glass rounded-3xl p-10 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 bg-green-500/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <CheckCircle size={32} className="text-green-400" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Enquiry Received! 🎉
                </h2>
                <p className="text-white/50 mb-6 max-w-sm">
                  We&apos;ll get back to you within 2–4 hours. Check your email for a confirmation. Better yet — WhatsApp us for an instant reply!
                </p>
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919876543210'}?text=Hi!%20I%20just%20submitted%20an%20enquiry%20on%20your%20website.%20Name%3A%20${encodeURIComponent(form.name)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="btn-primary"
                >
                  <MessageCircle size={15} /> Follow up on WhatsApp
                </a>
              </div>
            ) : (
              <div className="glass rounded-3xl p-7 gradient-border">
                <h2 className="text-xl font-bold text-white mb-5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Send us an enquiry
                </h2>

                {status === 'error' && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-5">
                    <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{errorMsg}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/50 text-xs uppercase tracking-widest mb-1.5 block">Full Name *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => update('name', e.target.value)}
                        required
                        placeholder="Your full name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-white/50 text-xs uppercase tracking-widest mb-1.5 block">Phone Number *</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => update('phone', e.target.value)}
                        required
                        placeholder="10-digit mobile number"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-white/50 text-xs uppercase tracking-widest mb-1.5 block">Email Address</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      placeholder="your@email.com (optional)"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-primary/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-white/50 text-xs uppercase tracking-widest mb-1.5 block">Interested In</label>
                    <select
                      value={form.service_interest}
                      onChange={e => update('service_interest', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-all appearance-none"
                    >
                      {SERVICES.map(s => (
                        <option key={s} value={s} className="bg-bg-deep">{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-white/50 text-xs uppercase tracking-widest mb-1.5 block">Message</label>
                    <textarea
                      value={form.message}
                      onChange={e => update('message', e.target.value)}
                      rows={4}
                      placeholder="Tell us about your project, budget, timeline, or anything else that would help us respond better..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-primary/50 transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'loading' ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send size={15} /> Send Enquiry
                      </>
                    )}
                  </button>

                  <p className="text-white/25 text-xs text-center">
                    By submitting, you agree to be contacted by GTCS. We never share your data.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>

      </main>
      <Footer />
    </>
  )
}
