import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowRight, BookOpen, Clock, Users, Star, GraduationCap, Award, Laptop } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Free Education Coaching',
  description: 'GTCS provides 100% free coaching for Class 10, Class 12, JEE, NEET, UPSC and tech skills. No fees, no hidden charges.',
}

const COURSES = [
  {
    category: 'School Education',
    color: '#0066CC',
    icon: BookOpen,
    items: [
      { name: 'Class 10 — All Subjects', desc: 'Math, Science, English, Social Science — CBSE & ICSE curriculum', free: true },
      { name: 'Class 12 — Science (PCM)', desc: 'Physics, Chemistry, Math — board exam + JEE preparation', free: true },
      { name: 'Class 12 — Science (PCB)', desc: 'Physics, Chemistry, Biology — board + NEET foundation', free: true },
      { name: 'Class 12 — Commerce', desc: 'Accounts, Business Studies, Economics, Math', free: true },
    ],
  },
  {
    category: 'Competitive Exams',
    color: '#FF6600',
    icon: Award,
    items: [
      { name: 'JEE Mains & Advanced', desc: 'Physics, Chemistry, Math — concept videos + practice tests', free: true },
      { name: 'NEET UG', desc: 'Physics, Chemistry, Biology — NCERT-based + PYQ analysis', free: true },
      { name: 'UPSC CSE Foundation', desc: 'GS Paper 1/2/3/4 — polity, economy, geography, CSAT', free: true },
      { name: 'SSC CGL / CHSL', desc: 'Quant, reasoning, English, GK — previous year paper analysis', free: true },
      { name: 'Bank PO / Clerk', desc: 'Aptitude, reasoning, English, banking awareness', free: true },
    ],
  },
  {
    category: 'Tech Skills',
    color: '#8B5CF6',
    icon: Laptop,
    items: [
      { name: 'Web Development (HTML/CSS/JS)', desc: 'From zero to building real websites — 40-hour structured course', free: true },
      { name: 'React & Next.js', desc: 'Modern frontend development — build projects live', free: true },
      { name: 'Python & Data Science Basics', desc: 'Python fundamentals → pandas → matplotlib → ML intro', free: true },
      { name: 'Digital Marketing', desc: 'SEO, Google Ads, Meta Ads, content, analytics — practical course', free: true },
      { name: 'Graphic Design (Canva + Figma)', desc: 'Logo, social media, UI/UX basics — no design experience needed', free: true },
    ],
  },
  {
    category: 'Career Development',
    color: '#10B981',
    icon: GraduationCap,
    items: [
      { name: 'Resume Writing & LinkedIn', desc: 'Build a resume that gets calls — ATS optimisation and personal brand', free: true },
      { name: 'Interview Preparation', desc: 'HR, technical, and case interviews — mock sessions available', free: true },
      { name: 'Freelancing Masterclass', desc: 'How to get your first client on Fiverr / Upwork / direct', free: true },
    ],
  },
]

const HOW_IT_WORKS = [
  { step: '1', title: 'Join our WhatsApp group', desc: 'One WhatsApp message to join the batch. We send study schedules, notes, and live class links directly.' },
  { step: '2', title: 'Attend live / recorded classes', desc: 'Google Meet sessions (recorded on YouTube). Notes shared as PDF after each class.' },
  { step: '3', title: 'Practice with assignments', desc: 'Weekly assignments, mini-tests, and doubt-clearing sessions every Saturday.' },
  { step: '4', title: 'Get certified', desc: 'Complete 80% attendance → receive your GTCS digital certificate, shareable on LinkedIn.' },
]

const TESTIMONIALS = [
  { name: 'Sneha Gupta', course: 'JEE Mains 2025', text: 'I cleared JEE Mains with 97 percentile. The GTCS coaching was as good as paid coaching centres — and it was completely free!', rating: 5 },
  { name: 'Arjun Verma', course: 'Web Dev Batch', text: 'Got my first freelancing project on Fiverr within 2 months of completing the web dev course. Incredible value!', rating: 5 },
  { name: 'Pooja Nair', course: 'NEET Foundation', text: 'The biology classes are crystal clear. I was struggling with NCERT but now I can solve any question. Thank you GTCS!', rating: 5 },
]

const UPCOMING_BATCHES = [
  { name: 'JEE Mains 2027 — Batch A', startDate: 'April 15, 2026', seats: 50, icon: '📐', enroll: true },
  { name: 'NEET 2027 — Biology Focus', startDate: 'April 20, 2026', seats: 40, icon: '🔬', enroll: true },
  { name: 'Python + Data Science', startDate: 'May 1, 2026', seats: 60, icon: '🐍', enroll: true },
  { name: 'Web Development — June Batch', startDate: 'June 1, 2026', seats: 100, icon: '💻', enroll: false },
  { name: 'UPSC CSE Foundation', startDate: 'May 15, 2026', seats: 75, icon: '🏛️', enroll: true },
  { name: 'Digital Marketing Pro', startDate: 'May 20, 2026', seats: 80, icon: '📈', enroll: true },
]

export default function EducationPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">

        {/* HERO */}
        <section className="relative py-24 px-4 overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-50" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(245,158,11,0.15),transparent)]" />
          <div className="relative z-10 max-w-5xl mx-auto text-center">

            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 text-sm">
              <GraduationCap size={14} className="text-yellow-400" />
              <span className="text-white/70">100% Free — Always. No fees, ever.</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-5 leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Free Coaching for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                Every Student
              </span>
            </h1>
            <p className="text-white/55 text-xl leading-relaxed mb-8 max-w-2xl mx-auto">
              GTCS believes talent is everywhere but opportunity is not. We provide free coaching for school exams, competitive exams, and tech skills — with no hidden fees, ever.
            </p>

            <div className="flex flex-wrap gap-3 justify-center mb-10">
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919876543210'}?text=Hi!%20I%20want%20to%20enroll%20in%20free%20coaching%20at%20GTCS.`}
                target="_blank" rel="noopener noreferrer"
                className="btn-accent"
              >
                Enroll for Free <ArrowRight size={16} />
              </a>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919876543210'}?text=Can%20you%20share%20upcoming%20batch%20details%3F`}
                target="_blank" rel="noopener noreferrer"
                className="btn-outline"
              >
                View Batches
              </a>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 justify-center">
              {[
                { v: '2,000+', l: 'Students enrolled' },
                { v: '15+', l: 'Courses available' },
                { v: '100%', l: 'Free, always' },
                { v: '4.9★', l: 'Student rating' },
              ].map(({ v, l }) => (
                <div key={l} className="text-center">
                  <div className="text-2xl font-black text-white mb-0.5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{v}</div>
                  <div className="text-white/35 text-xs">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-16 px-4 bg-bg-card/40">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="section-label mb-2">Simple Process</p>
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>How it works</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {HOW_IT_WORKS.map(({ step, title, desc }) => (
                <div key={step} className="glass rounded-2xl p-5 text-center">
                  <div className="w-10 h-10 bg-yellow-500/15 border border-yellow-500/30 rounded-xl flex items-center justify-center text-yellow-400 font-black text-base mx-auto mb-4">
                    {step}
                  </div>
                  <h3 className="text-white font-semibold mb-2 text-sm">{title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COURSES */}
        {COURSES.map(({ category, color, icon: Icon, items }) => (
          <section key={category} className="py-16 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{category}</h2>
                <span className="chip">Free</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(({ name, desc }) => (
                  <div key={name} className="glass rounded-2xl p-5 hover:border-primary/25 transition-all">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-white font-semibold text-sm">{name}</h3>
                      <span className="text-green-400 text-xs font-bold flex-shrink-0">FREE</span>
                    </div>
                    <p className="text-white/40 text-xs leading-relaxed mb-3">{desc}</p>
                    <a
                      href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919876543210'}?text=Hi!%20I%20want%20to%20enroll%20in%20${encodeURIComponent(name)}%20at%20GTCS.`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80"
                      style={{ color }}
                    >
                      Enroll Now <ArrowRight size={11} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* UPCOMING BATCHES */}
        <section className="py-16 px-4 bg-bg-card/40">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="section-label mb-2">Upcoming Batches</p>
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Register before seats fill up</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {UPCOMING_BATCHES.map(({ name, startDate, seats, icon, enroll }) => (
                <div key={name} className="glass rounded-2xl p-5 flex flex-col">
                  <div className="text-2xl mb-2">{icon}</div>
                  <h3 className="text-white font-semibold text-sm mb-1">{name}</h3>
                  <div className="flex items-center gap-3 mb-3 text-xs text-white/40">
                    <span className="flex items-center gap-1"><Clock size={10} /> {startDate}</span>
                    <span className="flex items-center gap-1"><Users size={10} /> {seats} seats</span>
                  </div>
                  <div className="mt-auto">
                    {enroll ? (
                      <a
                        href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919876543210'}?text=Hi!%20I%20want%20to%20register%20for%20${encodeURIComponent(name)}.`}
                        target="_blank" rel="noopener noreferrer"
                        className="w-full text-center block py-2 bg-primary/15 border border-primary/30 rounded-xl text-primary-light text-xs font-semibold hover:bg-primary/20 transition-colors"
                      >
                        Register Free →
                      </a>
                    ) : (
                      <div className="w-full text-center py-2 bg-white/5 rounded-xl text-white/30 text-xs">
                        Registrations opening soon
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="section-label mb-2">Student Stories</p>
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>What our students say</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {TESTIMONIALS.map(({ name, course, text, rating }) => (
                <div key={name} className="glass rounded-2xl p-5 flex flex-col">
                  <div className="flex mb-2">
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star key={i} size={13} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-white/65 text-sm leading-relaxed flex-1 mb-4 italic">&ldquo;{text}&rdquo;</p>
                  <div>
                    <div className="text-white text-sm font-semibold">{name}</div>
                    <div className="text-white/35 text-xs">{course}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto glass rounded-3xl p-10 text-center gradient-border">
            <GraduationCap size={36} className="mx-auto mb-4 text-yellow-400" />
            <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Start learning — it&apos;s free.
            </h2>
            <p className="text-white/45 mb-6">Send us a WhatsApp message to join your first batch today.</p>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919876543210'}?text=Hi%20GTCS!%20I%20want%20to%20join%20the%20free%20coaching%20program.%20Please%20share%20batch%20details.`}
              target="_blank" rel="noopener noreferrer"
              className="btn-accent"
            >
              WhatsApp to Enroll Free <ArrowRight size={16} />
            </a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
