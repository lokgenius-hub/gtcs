import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import {
  Download, Monitor, WifiOff, Wifi, CheckCircle, Zap, MessageCircle,
  Utensils, BedDouble, Users, TrendingUp, Building2, Crown, Package,
  ChefHat, Coins, QrCode, BarChart3, Shield, ArrowRight,
} from 'lucide-react'

export const metadata = {
  title: 'Download HospiFlow Apps — Restaurant POS, Hotel Manager & More | GTCS',
  description: 'Download offline-first desktop apps for restaurants, hotels & hospitality. POS, KOT, Inventory, Staff, Loyalty Coins — works without internet, syncs when online.',
}

// GitHub Releases CDN — always latest version, no version number needed
const GH_BASE = 'https://github.com/gentechcs/hospiflow-apps/releases/latest/download'
const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP || '919876543210'
const waLink = (msg: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`

const SOLO_PRODUCTS = [
  {
    id: 'restaurant-pos',
    icon: Utensils,
    color: '#FF6600',
    name: 'Restaurant POS',
    tagline: 'Billing, KOT & loyalty — built for restaurants',
    exe: 'HospiFlow-Restaurant-POS-Setup.exe',
    size: '~95 MB',
    price: '₹6,999/yr',
    includes: [
      'POS Terminal — cash, UPI, card',
      'KOT Kitchen Display',
      'Table Management',
      'Sales Reports',
      'Loyalty Coins & Rewards',
      'Menu Management',
    ],
  },
  {
    id: 'hotel-manager',
    icon: BedDouble,
    color: '#0066CC',
    name: 'Hotel Manager',
    tagline: 'Rooms, check-in/out, staff & inventory',
    exe: 'HospiFlow-Hotel-Manager-Setup.exe',
    size: '~95 MB',
    price: '₹8,999/yr',
    includes: [
      'Room Management (check-in, check-out)',
      'Booking Calendar',
      'Housekeeping Status',
      'Staff Roster & Attendance',
      'Expense Tracker',
      'Inventory & Stock',
    ],
  },
  {
    id: 'staff-inventory',
    icon: Users,
    color: '#16A34A',
    name: 'Staff & Inventory',
    tagline: 'HR, attendance, stock & expenses',
    exe: 'HospiFlow-Staff-Inventory-Setup.exe',
    size: '~90 MB',
    price: '₹3,999/yr',
    includes: [
      'Staff Management & Roles',
      'Attendance Tracking',
      'Salary & Expense Reports',
      'Inventory / Stock Management',
      'Low-Stock Alerts',
      'Purchase Orders',
    ],
  },
]

const BUNDLE_PRODUCTS = [
  {
    id: 'restaurant-starter',
    icon: Zap,
    color: '#FF6600',
    name: 'Restaurant Starter',
    tagline: 'POS + Online Orders + QR Menu + Coins',
    exe: 'HospiFlow-Restaurant-Starter-Setup.exe',
    size: '~95 MB',
    popular: false,
    price: '₹11,999/yr',
    includes: [
      'Everything in Restaurant POS',
      'QR Menu (customer self-ordering)',
      'Online Order Management',
      'Email order notifications',
      'Daily sales summary',
    ],
  },
  {
    id: 'restaurant-pro',
    icon: TrendingUp,
    color: '#9333EA',
    name: 'Restaurant Pro',
    tagline: 'Full restaurant operations suite',
    exe: 'HospiFlow-Restaurant-Pro-Setup.exe',
    size: '~95 MB',
    popular: true,
    price: '₹16,999/yr',
    includes: [
      'Everything in Restaurant Starter',
      'Staff Management & Payroll',
      'Inventory & Stock Alerts',
      'Online Orders (Zomato/Swiggy)',
      'Advanced reports',
    ],
  },
  {
    id: 'hotel-plus',
    icon: Building2,
    color: '#0066CC',
    name: 'Hotel Plus',
    tagline: 'Hotel + in-house restaurant + full ops',
    exe: 'HospiFlow-Hotel-Plus-Setup.exe',
    size: '~95 MB',
    popular: true,
    price: '₹19,999/yr',
    includes: [
      'All Hotel Manager features',
      'Restaurant POS & KOT',
      'Events & Banquet Bookings',
      'Loyalty Coins',
      'Unified booking calendar',
    ],
  },
  {
    id: 'full-suite',
    icon: Crown,
    color: '#c9a84c',
    name: 'Full Suite',
    tagline: 'Every module — hotel, restaurant & beyond',
    exe: 'HospiFlow-Full-Suite-Setup.exe',
    size: '~100 MB',
    popular: false,
    price: '₹29,999/yr',
    includes: [
      'Everything in Hotel Plus',
      'Travel Package Management',
      'Events & Venue CRM',
      'Blog & Gallery admin',
      'All reports & exports',
    ],
  },
]

const OFFLINE_MATRIX = [
  { feature: 'POS UI loads', offline: true,  online: true },
  { feature: 'Take orders, generate bills',   offline: true,  online: true },
  { feature: 'Print KOT to kitchen',          offline: true,  online: true },
  { feature: 'Sync orders to cloud',          offline: false, online: true },
  { feature: 'Online orders (Zomato/OTA)',    offline: false, online: true },
  { feature: 'View cloud bookings/enquiries', offline: false, online: true },
  { feature: 'Staff attendance',              offline: true,  online: true },
  { feature: 'Inventory tracking',            offline: true,  online: true },
]

const STEPS = [
  { n: '1', title: 'Download .exe', desc: 'Click any product below. Free 15-day trial — no payment needed to download.' },
  { n: '2', title: 'Install', desc: 'Double-click the .exe → follow wizard → shortcut created on Desktop.' },
  { n: '3', title: 'Contact GTCS', desc: 'WhatsApp us after install. We create your tenant account and send you your Tenant ID + login credentials.' },
  { n: '4', title: 'Activate & Go', desc: 'Open the app → log in with your credentials — your data is live. POS works offline instantly.' },
]

export default function DownloadPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="relative bg-gradient-to-br from-[#050A14] via-[#0A1628] to-[#0F172A] text-white pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-[#0066CC] rounded-full blur-[120px]" />
            <div className="absolute bottom-10 right-20 w-96 h-96 bg-[#FF6600] rounded-full blur-[150px]" />
          </div>
          <div className="container mx-auto px-6 text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold mb-6 uppercase tracking-wide">
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              Offline-first · Works without internet · Auto-sync
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              Download <span className="text-[#FF6600]">HospiFlow</span> Apps
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-4">
              Separate downloadable apps for every part of your business.
              POS, Hotel, Staff, Inventory — pick what you need.
              All apps work 100% offline and sync to cloud when internet returns.
            </p>
            <p className="text-sm text-gray-500 mb-10">
              Windows PC (64-bit) · Free 15-day trial · No credit card needed
            </p>
            <a
              href={`#bundles`}
              className="inline-flex items-center gap-2 bg-[#0066CC] hover:bg-[#0052A3] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
            >
              <Download className="w-5 h-5" />
              See All Downloads
            </a>
          </div>
        </section>

        {/* ── Individual Apps ───────────────────────────────────── */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase tracking-wider">
                Individual Apps
              </div>
              <h2 className="text-3xl font-extrabold text-[#0F172A]">Pick Only What You Need</h2>
              <p className="text-gray-500 mt-2 max-w-xl mx-auto">
                Each app is a standalone installer. Buy one module, add more later.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {SOLO_PRODUCTS.map((p) => (
                <div key={p.id} className="rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-gray-300 transition-all group">
                  <div className="h-2" style={{ backgroundColor: p.color }} />
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: p.color + '18' }}>
                        <p.icon className="w-6 h-6" style={{ color: p.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-[#0F172A]">{p.name}</div>
                        <div className="text-xs text-gray-400">{p.tagline}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-black text-sm" style={{ color: p.color }}>{p.price}</div>
                        <div className="text-[10px] text-gray-400">+ GST</div>
                      </div>
                    </div>

                    <ul className="space-y-1.5 mb-6">
                      {p.includes.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: p.color }} />
                          {item}
                        </li>
                      ))}
                      <li className="flex items-start gap-2 text-sm text-amber-600 font-medium">
                        <WifiOff className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        Offline — syncs on reconnect
                      </li>
                    </ul>

                    <a
                      href={`${GH_BASE}/${p.exe}`}
                      download
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: p.color }}
                    >
                      <Download className="w-4 h-4" />
                      Download .exe · {p.size}
                    </a>
                    <p className="text-xs text-gray-400 text-center mt-2">Windows 10/11 (64-bit)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bundles ───────────────────────────────────────────── */}
        <section id="bundles" className="py-20 bg-[#F8FAFC]">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-[#EFF6FF] text-[#0066CC] px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase tracking-wider">
                Bundles — Save More
              </div>
              <h2 className="text-3xl font-extrabold text-[#0F172A]">All-in-One Packages</h2>
              <p className="text-gray-500 mt-2 max-w-xl mx-auto">
                Pre-configured bundles for restaurants, hotels and complete hospitality operations.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {BUNDLE_PRODUCTS.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-2xl overflow-hidden transition-all ${
                    p.popular
                      ? 'ring-2 shadow-xl'
                      : 'border border-gray-200 hover:shadow-lg'
                  }`}
                  style={p.popular ? { ringColor: p.color } : {}}
                >
                  {p.popular && (
                    <div className="py-1.5 text-center text-xs font-bold text-white" style={{ backgroundColor: p.color }}>
                      ★ MOST POPULAR
                    </div>
                  )}
                  {!p.popular && <div className="h-2" style={{ backgroundColor: p.color }} />}
                  <div className="p-6 bg-white">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: p.color + '18' }}>
                          <p.icon className="w-6 h-6" style={{ color: p.color }} />
                        </div>
                        <div>
                          <div className="font-bold text-lg text-[#0F172A]">{p.name}</div>
                          <div className="text-xs text-gray-400">{p.tagline}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-black text-base" style={{ color: p.color }}>{p.price}</div>
                        <div className="text-[10px] text-gray-400">+ GST</div>
                      </div>
                    </div>

                    <ul className="space-y-1.5 mb-6">
                      {p.includes.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: p.color }} />
                          {item}
                        </li>
                      ))}
                      <li className="flex items-start gap-2 text-sm text-amber-600 font-medium">
                        <WifiOff className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        Offline — syncs on reconnect
                      </li>
                    </ul>

                    <a
                      href={`${GH_BASE}/${p.exe}`}
                      download
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: p.color }}
                    >
                      <Download className="w-4 h-4" />
                      Download .exe · {p.size}
                    </a>
                    <p className="text-xs text-gray-400 text-center mt-2">Windows 10/11 (64-bit)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Offline matrix ────────────────────────────────────── */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6 max-w-3xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase tracking-wider">
                <WifiOff className="w-3 h-3" /> Offline Capability
              </div>
              <h2 className="text-3xl font-extrabold text-[#0F172A]">What works without internet?</h2>
            </div>

            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
                <div className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Feature</div>
                <div className="px-4 py-3 text-xs font-bold text-red-600 uppercase text-center">No Internet</div>
                <div className="px-4 py-3 text-xs font-bold text-green-600 uppercase text-center">Online</div>
              </div>
              {OFFLINE_MATRIX.map((row, i) => (
                <div key={row.feature} className={`grid grid-cols-3 border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <div className="px-4 py-3 text-sm text-gray-700">{row.feature}</div>
                  <div className="px-4 py-3 text-center">
                    {row.offline
                      ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      : <span className="text-red-400 text-lg font-bold">×</span>
                    }
                  </div>
                  <div className="px-4 py-3 text-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center mt-4">
              Orders taken offline → queued in IndexedDB → auto-synced to Supabase when internet returns
            </p>
          </div>
        </section>

        {/* ── How to install ────────────────────────────────────── */}
        <section className="py-20 bg-[#F8FAFC]">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-[#EFF6FF] text-[#0066CC] px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase tracking-wider">
                <Monitor className="w-3 h-3" /> Windows PC / Laptop
              </div>
              <h2 className="text-3xl font-extrabold text-[#0F172A]">Up and running in 4 steps</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {STEPS.map((s) => (
                <div key={s.n} className="text-center">
                  <div className="w-14 h-14 bg-[#0066CC] text-white rounded-full flex items-center justify-center text-2xl font-extrabold mx-auto mb-4">
                    {s.n}
                  </div>
                  <h3 className="text-lg font-bold text-[#0F172A] mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500">{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#EFF6FF] border border-[#0066CC]/15 rounded-2xl p-6 max-w-2xl mx-auto mt-12">
              <h4 className="font-bold text-[#0066CC] mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" /> What the installer does
              </h4>
              <ul className="space-y-2">
                {[
                  'Installs to C:\\Program Files\\HospiFlow',
                  'Creates Desktop shortcut + Start Menu entry',
                  'Stores all data locally — works without internet',
                  'Auto-syncs to Supabase cloud when internet is available',
                  'Uninstallable from Windows "Add/Remove Programs"',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-[#0066CC] mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Frontend website CTA ──────────────────────────────── */}
        <section className="py-16 bg-white border-y border-gray-100">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1e293b] text-white p-8 md:p-10">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-bold mb-3 uppercase tracking-wider">
                    Public Website — Separate Service
                  </div>
                  <h3 className="text-2xl font-extrabold mb-2">Need a public-facing website?</h3>
                  <p className="text-gray-400 text-sm">
                    Menu page · Booking page · Gallery · Blog · Contact form · QR ordering for customers
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Every website is built custom for your brand — unique design, your domain, your content.
                    This is a separate consultation and is <strong className="text-white">not included</strong> in the above downloads.
                  </p>
                </div>
                <div className="shrink-0">
                  <a
                    href={waLink('Hi! I need a custom website for my restaurant/hotel. Can you help?')}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-6 py-3 rounded-xl font-bold transition-all"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Enquire on WhatsApp
                  </a>
                  <Link
                    href="/contact"
                    className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Or use contact form <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── License / Activation ─────────────────────────────── */}
        <section className="py-16 bg-[#F8FAFC]">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-xl mx-auto">
              <Shield className="w-10 h-10 text-[#0066CC] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">Activation — How it works</h3>
              <p className="text-gray-500 mb-6 text-sm">
                After installing, the app asks for your login credentials. We create your account on our cloud
                after confirming your order — takes 5 minutes. You get an email with your login details.
                Your data is isolated from all other customers — completely private.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={waLink('Hi! I downloaded HospiFlow and need help with setup / license.')}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-6 py-3 rounded-xl font-bold transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp Setup Help
                </a>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-[#0066CC] border border-[#0066CC]/30 px-6 py-3 rounded-xl font-bold transition-all"
                >
                  View Pricing Plans <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

