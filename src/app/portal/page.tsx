'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ShoppingCart, Loader2, WifiOff } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_SAAS_API_URL || 'http://localhost:4000'

export default function PortalLogin() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [err, setErr]           = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('hf_token')) {
      router.replace('/portal/pos')
    }
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(data.message || 'Invalid credentials')
        return
      }
      localStorage.setItem('hf_token', data.data.tokens.access)
      localStorage.setItem('hf_refresh', data.data.tokens.refresh)
      localStorage.setItem('hf_user', JSON.stringify(data.data.user))
      router.replace('/portal/pos')
    } catch {
      setErr('Could not reach server. Check your internet connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050A14] via-[#0A1628] to-[#0F172A] flex items-center justify-center px-4">
      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0066CC] rounded-2xl mb-4 shadow-xl shadow-blue-500/30">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">HospiFlow POS</h1>
          <p className="text-gray-400 text-sm mt-1">Online Portal — sign in to start billing</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-xl"
        >
          {err && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
              <WifiOff className="w-4 h-4 shrink-0" />
              {err}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/10 border border-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/10 border border-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC] transition-all pr-11"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0066CC] hover:bg-[#0052A3] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          Need an account?{' '}
          <a
            href={`https://wa.me/919876543210?text=Hi!%20I%20need%20HospiFlow%20POS%20access`}
            target="_blank" rel="noopener noreferrer"
            className="text-[#0066CC] hover:underline"
          >
            Contact GTCS on WhatsApp
          </a>
        </p>
      </div>
    </div>
  )
}
