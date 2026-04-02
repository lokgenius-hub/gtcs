import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { CheckCircle, MessageCircle, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pricing — HospiFlow SaaS Plans',
  description: 'Transparent pricing for HospiFlow SaaS — POS, Hotel, QR Menu, Loyalty, Inventory, Staff & Reports. Yearly and Lifetime options.',
}

// All prices in INR (ex-GST) — sourced from saas-backend/src/config/plans.js
const BUNDLE_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Perfect for small restaurants & cafes',
    modules: ['POS System', 'QR Digital Menu'],
    users: 2,
    branches: 1,
    yearly: 5999,
    lifetime: 22999,
    renewal: 2499,
    color: '#6366f1',
    popular: false,
    features: [
      '2 Users',
      '1 Branch',
      'Unlimited bills per day',
      'Cash / Card / UPI payments',
      'Digital QR Menu (food display)',
      'Kitchen Order Tickets (KOT)',
      'Basic daily reports',
      'WhatsApp onboarding & support',
      'Chat support',
      '14-day free trial',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'For growing restaurants & hotels',
    modules: ['POS System', 'QR Menu', 'Coin / Loyalty', 'Restaurant Mgmt', 'Reports & Analytics'],
    users: 5,
    branches: 1,
    yearly: 11999,
    lifetime: 44999,
    renewal: 3999,
    color: '#0066CC',
    popular: true,
    features: [
      '5 Users',
      '1 Branch',
      'Everything in Starter, plus:',
      'Loyalty / Coin reward system',
      'Customer tiers & gift cards',
      'Restaurant floor plan & table management',
      'GST-ready reports',
      'Online portal access (cloud)',
      'Inventory management',
      'Priority email support',
      '14-day free trial',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Full suite for hotels & multi-restaurants',
    modules: ['POS', 'QR Menu', 'Loyalty', 'Restaurant', 'Hotel Mgmt', 'Inventory', 'Staff/HR', 'Reports'],
    users: -1,
    branches: 1,
    yearly: 21999,
    lifetime: 79999,
    renewal: 5999,
    color: '#10B981',
    popular: false,
    features: [
      'Unlimited Users',
      '1 Branch (add more @ ₹5,000/branch/yr)',
      'Everything in Professional, plus:',
      'Hotel room booking & folio billing',
      'Inventory & vendor management',
      'Staff attendance & salary',
      'GST e-invoice ready billing',
      'Mobile-responsive portal (any device)',
      'Dedicated support channel',
      '14-day free trial',
    ],
  },
  {
    id: 'enterprise_plus',
    name: 'Enterprise Plus',
    tagline: 'For chains, franchises & multi-branch',
    modules: ['All modules', 'Unlimited branches', 'API access', 'White-label option'],
    users: -1,
    branches: -1,
    yearly: 39999,
    lifetime: 149999,
    renewal: 9999,
    color: '#F59E0B',
    popular: false,
    features: [
      'Unlimited Users',
      'Unlimited Branches',
      'Centralised multi-branch dashboard',
      'Branch-wise profit/loss reports',
      'Stock transfer between branches',
      'Custom domain for QR Menu',
      'API access for integrations',
      'White-label option (on request)',
      '24/7 Dedicated support',
      '14-day free trial',
    ],
  },
]

const MODULE_PRICING = [
  { name: 'POS System', icon: '🧾', yearly: 3999, lifetime: 14999, renewal: 1499 },
  { name: 'Coin / Loyalty', icon: '🪙', yearly: 2999, lifetime: 11999, renewal: 999 },
  { name: 'QR Digital Menu', icon: '📲', yearly: 2499, lifetime: 9999, renewal: 999 },
  { name: 'Hotel Management', icon: '🏨', yearly: 4999, lifetime: 19999, renewal: 1999 },
  { name: 'Restaurant Mgmt', icon: '🍽️', yearly: 3499, lifetime: 13999, renewal: 1499 },
  { name: 'Inventory', icon: '📦', yearly: 2499, lifetime: 9999, renewal: 999 },
  { name: 'Staff & HR', icon: '👥', yearly: 1999, lifetime: 7999, renewal: 799 },
  { name: 'Reports & Analytics', icon: '📊', yearly: 1499, lifetime: 5999, renewal: 499 },
]

const ADDONS = [
  { name: 'Extra Branch / Outlet', yearly: '₹5,000/yr', lifetime: '₹21,000' },
  { name: 'Extra User', yearly: '₹1,000/yr', lifetime: '₹5,000' },
  { name: 'Custom Domain — QR Menu', yearly: '₹2,000/yr', lifetime: '' },
  { name: 'Custom Module Development', yearly: 'Quote on request', lifetime: '' },
  { name: 'Data Migration / Setup', yearly: '₹3,000 (one-time)', lifetime: '' },
  { name: 'On-site Training (per day)', yearly: '₹5,000', lifetime: '' },
]

const FAQS = [
  {
    q: 'Is there a free trial?',
    a: 'Yes! Every new account gets a 14-day free trial with Professional plan features — no credit card required.',
  },
  {
    q: 'What does "Lifetime" mean?',
    a: 'Pay once, use forever. Lifetime plans include all future feature updates within the same tier. Renewals are only needed for add-ons like extra WhatsApp credits.',
  },
  {
    q: 'Can I start with one module and upgrade later?',
    a: 'Absolutely. Buy the POS module today, add Hotel Management next month. Each module is sold independently and the subscription is prorated.',
  },
  {
    q: 'Are prices including GST?',
    a: 'No. All listed prices exclude 18% GST. Final invoice includes GST as applicable.',
  },
  {
    q: 'How is the SaaS hosted? Do I need a server?',
    a: 'Fully cloud-hosted on Supabase (PostgreSQL database + authentication). You just need a browser or the desktop app — no server setup, no IT team required.',
  },
  {
    q: 'How does the QR Menu work for restaurants?',
    a: 'We create a digital menu for your restaurant hosted on a web link. You print a QR code for each table. Customers scan → see your menu on their phone. Online table-ordering (where customers place orders themselves from their phone) is available as a custom add-on — contact us to discuss.',
  },
  {
    q: 'Can I get custom features added?',
    a: 'Yes. Enterprise customers can request custom modules. We quote separately based on complexity.',
  },
]

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">

        {/* HERO */}
        <section className="py-20 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(0,102,204,0.18),transparent)]" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <p className="section-label mb-3">Transparent Pricing</p>
            <h1 className="section-title mb-5">Pick a plan. Go live today.</h1>
            <p className="section-sub mx-auto mb-6">
              All prices in INR, excluding 18% GST. 14-day free trial — no credit card. Yearly or pay-once Lifetime options.
            </p>
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm text-white/60">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              14-day free trial — no credit card required
            </div>
          </div>
        </section>

        {/* BUNDLE PLANS */}
        <section className="pb-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {BUNDLE_PLANS.map(plan => (
                <div
                  key={plan.id}
                  className={`pricing-card gradient-border ${plan.popular ? 'popular relative' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                      🔥 Most Popular
                    </div>
                  )}

                  <div className="mb-5">
                    <h3 className="text-white font-black text-xl mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{plan.name}</h3>
                    <p className="text-white/40 text-xs">{plan.tagline}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-2">
                    <div className="text-white font-black text-3xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      ₹{plan.yearly.toLocaleString('en-IN')}
                      <span className="text-white/35 text-sm font-normal">/year</span>
                    </div>
                    <div className="text-white/35 text-xs mt-1">
                      or ₹{plan.lifetime.toLocaleString('en-IN')} lifetime (pay once)
                    </div>
                  </div>
                  <div className="text-white/25 text-xs mb-5">
                    Renewal @ ₹{plan.renewal.toLocaleString('en-IN')}/yr after yr 1 • + 18% GST
                  </div>

                  {/* Modules */}
                  <div className="mb-5 pb-5 border-b border-white/8">
                    <div className="text-white/40 text-xs uppercase tracking-widest mb-2">Includes</div>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.modules.map(m => (
                        <span key={m} className="chip text-[10px]">{m}</span>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className={`flex items-start gap-2 text-sm ${f.includes('Everything') ? 'text-primary-light font-semibold' : 'text-white/60'}`}>
                        <CheckCircle size={13} className="text-primary flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-col gap-2">
                    <a
                      href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919876543210'}?text=Hi!%20I%20want%20to%20subscribe%20to%20the%20${encodeURIComponent(plan.name)}%20plan%20of%20HospiFlow.`}
                      target="_blank" rel="noopener noreferrer"
                      className={`w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:shadow-lg`}
                      style={{
                        background: plan.popular ? `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)` : 'transparent',
                        border: `1px solid ${plan.color}60`,
                        color: plan.popular ? '#fff' : plan.color,
                        boxShadow: plan.popular ? `0 0 24px ${plan.color}40` : 'none',
                      }}
                    >
                      Start Free Trial →
                    </a>
                    <a
                      href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919876543210'}?text=Can%20I%20get%20a%20demo%20of%20HospiFlow%20${encodeURIComponent(plan.name)}%20plan%3F`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-full text-center py-2 text-xs text-white/35 hover:text-white/60 transition-colors"
                    >
                      Request demo call
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3-YEAR OFFERING */}
        <section className="py-10 px-4">
          <div className="max-w-3xl mx-auto glass rounded-2xl p-6 text-center">
            <Zap size={24} className="mx-auto mb-3 text-yellow-400" />
            <h3 className="text-white font-bold text-lg mb-1">3-Year Bundle — Save up to 25%</h3>
            <p className="text-white/45 text-sm mb-4">Lock in today&apos;s price for 3 years. No price-hikes, no surprises.</p>
            <div className="flex flex-wrap gap-4 justify-center text-sm">
              <span className="glass px-4 py-2 rounded-xl text-white/60">Starter 3yr: <strong className="text-white">₹14,999</strong></span>
              <span className="glass px-4 py-2 rounded-xl text-white/60">Professional 3yr: <strong className="text-white">₹29,999</strong></span>
              <span className="glass px-4 py-2 rounded-xl text-white/60">Enterprise 3yr: <strong className="text-white">₹54,999</strong></span>
              <span className="glass px-4 py-2 rounded-xl text-white/60">Enterprise+ 3yr: <strong className="text-white">₹99,999</strong></span>
            </div>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919876543210'}?text=I%20want%20to%20know%20about%20the%203-year%20HospiFlow%20plan.`}
              target="_blank" rel="noopener noreferrer"
              className="mt-4 btn-primary inline-flex"
            >
              <MessageCircle size={15} /> Get 3-Year Quote
            </a>
          </div>
        </section>

        {/* INDIVIDUAL MODULES */}
        <section className="py-16 px-4 bg-bg-card/40">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <p className="section-label mb-2">À-La-Carte Modules</p>
              <h2 className="section-title mb-3">Only pay for what you use</h2>
              <p className="text-white/45">Each module sold independently. Mix and match to build your perfect stack.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {MODULE_PRICING.map(({ name, icon, yearly, lifetime, renewal }) => (
                <div key={name} className="glass rounded-2xl p-5 hover:border-primary/25 transition-all hover:-translate-y-0.5">
                  <div className="text-3xl mb-3">{icon}</div>
                  <h3 className="text-white font-semibold text-sm mb-3">{name}</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/40">Yearly</span>
                      <span className="text-white font-bold">₹{yearly.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Lifetime</span>
                      <span className="text-white font-bold">₹{lifetime.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Renewal</span>
                      <span className="text-white/55">₹{renewal.toLocaleString('en-IN')}/yr</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-white/25 text-xs mt-5">All prices exclude 18% GST</p>
          </div>
        </section>

        {/* ADD-ONS */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <p className="section-label mb-2">Add-Ons</p>
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Extend your plan</h2>
            </div>
            <div className="glass rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left px-5 py-3 text-white/40 text-xs uppercase tracking-widest font-semibold">Add-On</th>
                    <th className="text-right px-5 py-3 text-white/40 text-xs uppercase tracking-widest font-semibold">Price</th>
                    <th className="text-right px-5 py-3 text-white/40 text-xs uppercase tracking-widest font-semibold hidden sm:table-cell">Lifetime</th>
                  </tr>
                </thead>
                <tbody>
                  {ADDONS.map(({ name, yearly, lifetime }) => (
                    <tr key={name} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3.5 text-white/70">{name}</td>
                      <td className="px-5 py-3.5 text-white text-right font-semibold">{yearly}</td>
                      <td className="px-5 py-3.5 text-white/40 text-right hidden sm:table-cell">{lifetime || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 bg-bg-card/40">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <p className="section-label mb-2">FAQ</p>
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Common questions</h2>
            </div>
            <div className="space-y-4">
              {FAQS.map(({ q, a }) => (
                <div key={q} className="glass rounded-2xl p-5">
                  <h3 className="text-white font-semibold mb-2 text-sm">{q}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Still not sure?</h2>
            <p className="text-white/45 mb-6">Talk to our team — we&apos;ll recommend the best plan for your specific business.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919876543210'}?text=Hi!%20Can%20you%20help%20me%20choose%20the%20right%20HospiFlow%20plan%3F`}
                target="_blank" rel="noopener noreferrer"
                className="btn-primary"
              >
                <MessageCircle size={15} /> WhatsApp Us
              </a>
              <Link href="/contact" className="btn-outline">Email Us</Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
