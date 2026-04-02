import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowRight, Users, Target, Heart, Code2, GraduationCap, Award, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About GTCS',
  description: 'Learn about Gentech Consultancy Services (GTCS) — our mission, values, team, and commitment to making technology accessible.',
}

const VALUES = [
  { icon: Code2, title: 'Quality First', desc: 'Pixel-perfect UI, clean code, real documentation. No shortcuts, no copy-paste jobs.' },
  { icon: Heart, title: 'Honest Pricing', desc: 'Fixed-price quotes, no hidden fees, no post-delivery surprises. What we quote is what you pay.' },
  { icon: Users, title: 'Long-term Relationships', desc: 'We build partnerships, not transactions. 80% of our revenue comes from repeat and referral clients.' },
  { icon: GraduationCap, title: 'Give Back', desc: 'Free education is our commitment to the next generation. Technology should empower everyone.' },
  { icon: Target, title: 'Results-Driven', desc: 'We measure success by your ROI, not our hours billed. If it doesn\'t work, we fix it.' },
  { icon: Award, title: 'Continuous Improvement', desc: 'We reinvest 20% of revenue in learning, tools, and infrastructure to stay ahead of the curve.' },
]

const TEAM = [
  { name: 'Founder & CEO', initials: 'GT', color: '#0066CC', role: 'Full-stack engineer with 10+ years building SaaS products. Passionate about Indian businesses going digital.' },
  { name: 'Head of Marketing', initials: 'RM', color: '#FF6600', role: 'Performance marketing specialist. Rs 5 Cr+ in ad spend managed. Obsessed with measurable ROI.' },
  { name: 'Lead Developer', initials: 'AP', color: '#8B5CF6', role: 'React Native & Electron expert. Built 20+ apps on Play Store & App Store. Senior engineer.' },
  { name: 'Education Head', initials: 'SN', color: '#10B981', role: 'Former IIT faculty. Passionate teacher who made it his mission to provide free quality education.' },
]

const MILESTONES = [
  { year: '2019', title: 'Founded', desc: 'GTCS started as a one-person web agency. First 5 clients in 3 months.' },
  { year: '2020', title: 'First SaaS product', desc: 'Launched our first subscription billing product — 50 restaurants onboarded in year 1.' },
  { year: '2021', title: 'Education initiative', desc: 'Launched free coaching after seeing how many talented students lacked access to quality education.' },
  { year: '2022', title: 'HospiFlow beta', desc: 'Full hotel + restaurant + POS system launched. 100 clients by end of year.' },
  { year: '2023', title: 'Series of apps', desc: 'Crossed 100 mobile apps delivered. Expanded digital marketing team to 10 specialists.' },
  { year: '2025', title: 'Enterprise scale', desc: '200+ active SaaS clients. 2,000+ education students. HospiFlow enterprise tier launched.' },
]

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">

        {/* HERO */}
        <section className="relative py-24 px-4 overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(0,102,204,0.2),transparent)]" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <p className="section-label mb-3">About GTCS</p>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-5 leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Technology that empowers{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light">
                every business
              </span>
            </h1>
            <p className="text-white/55 text-xl leading-relaxed max-w-2xl mx-auto">
              GTCS (Gentech Consultancy Services) is an Indian technology company building world-class software for businesses, and giving back through free education for students.
            </p>
          </div>
        </section>

        {/* MISSION */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="section-label mb-3">Our Mission</p>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Democratising technology for Bharat
              </h2>
              <p className="text-white/55 leading-relaxed mb-4">
                India has over 50 million small and medium businesses. Most of them are still running on pen and paper, WhatsApp groups, and spreadsheets. We exist to change that.
              </p>
              <p className="text-white/55 leading-relaxed mb-4">
                Our SaaS products are priced for Indian businesses — not Silicon Valley startups. Our digital marketing services help local businesses compete with national brands. Our education program ensures money is never a barrier to learning.
              </p>
              <p className="text-white/55 leading-relaxed mb-6">
                We see ourselves in the same mission as TCS, Infosys, and Wipro — but from the ground up, serving the businesses that need us most.
              </p>
              <Link href="/contact" className="btn-primary">
                Work With Us <ArrowRight size={16} />
              </Link>
            </div>

            <div className="space-y-4">
              {[
                { num: '✅', text: 'Built by an Indian team, for Indian businesses' },
                { num: '✅', text: 'GST-compliant, INR pricing, Indian payment gateways' },
                { num: '✅', text: 'WhatsApp-first support — no ticket queues' },
                { num: '✅', text: 'Regional language support in our products' },
                { num: '✅', text: 'Free education — no exceptions, no fine print' },
                { num: '✅', text: 'Transparent fixed pricing — no hourly billing surprises' },
              ].map((item, i) => (
                <div key={i} className="glass rounded-xl p-4 flex items-start gap-3">
                  <span className="text-sm">{item.num}</span>
                  <span className="text-white/70 text-sm leading-relaxed">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VALUES */}
        <section className="py-16 px-4 bg-bg-card/40">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <p className="section-label mb-2">Our Values</p>
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>What we stand for</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {VALUES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="glass rounded-2xl p-5">
                  <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center mb-4">
                    <Icon size={18} className="text-primary-light" />
                  </div>
                  <h3 className="text-white font-semibold mb-1.5">{title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MILESTONES */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <p className="section-label mb-2">Our Journey</p>
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Building one step at a time</h2>
            </div>
            <div className="relative">
              <div className="absolute left-[42px] top-0 bottom-0 w-px bg-gradient-to-b from-primary via-primary/30 to-transparent" />
              <div className="space-y-6">
                {MILESTONES.map(({ year, title, desc }) => (
                  <div key={year} className="flex gap-5">
                    <div className="flex-shrink-0 w-[84px] text-right">
                      <span className="text-primary font-black text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{year}</span>
                    </div>
                    <div className="w-4 h-4 rounded-full bg-primary border-4 border-bg-deep flex-shrink-0 mt-0.5" />
                    <div className="glass rounded-2xl p-4 flex-1 mb-0">
                      <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
                      <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TEAM */}
        <section className="py-16 px-4 bg-bg-card/40">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="section-label mb-2">Our Team</p>
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>The people behind GTCS</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {TEAM.map(({ name, initials, color, role }) => (
                <div key={name} className="glass rounded-2xl p-5 text-center">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg mx-auto mb-4"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}
                  >
                    {initials}
                  </div>
                  <div className="text-white font-semibold text-sm mb-1">{name}</div>
                  <p className="text-white/35 text-xs leading-relaxed">{role}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-white/30 text-sm mt-6">
              Plus 15+ engineers, designers, marketers, and teachers working remotely across India.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Ready to join 200+ happy clients?</h2>
            <p className="text-white/45 mb-6">Free consultation — we&apos;ll tell you exactly what you need (and what you don&apos;t).</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/contact" className="btn-primary">Get Free Consultation <ArrowRight size={16} /></Link>
              <Link href="/pricing" className="btn-outline">See Pricing</Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
