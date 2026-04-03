'use client'
import { Suspense } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  Bed, Users, Wifi, Tv, Wind, CheckCircle2, Loader2, X,
  Phone, Mail, CalendarDays, ChevronLeft, ChevronRight, Hotel,
  AlertCircle, Star,
} from 'lucide-react'

const pub = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL    || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

type Room = {
  id: string
  name: string
  type: string
  capacity: number
  price_per_night: number
  status: string
  amenities?: string[]
  image_url?: string
  description?: string
}

type BookForm = {
  name: string
  phone: string
  email: string
  checkIn: string
  checkOut: string
  guests: string
  message: string
}

const AMENITY_ICONS: Record<string, React.ElementType> = {
  wifi: Wifi, tv: Tv, ac: Wind,
}

const TYPE_BADGE: Record<string, string> = {
  Standard:    'Best Value',
  Deluxe:      'Most Popular',
  Suite:       'Premium',
  Executive:   'Business',
  Presidential: 'Luxury',
}

function genRefId() {
  return 'WEB-' + Date.now().toString(36).toUpperCase()
}

function BookPage() {
  const params   = useSearchParams()
  const tenantId = params.get('t') || ''

  const [rooms,     setRooms]     = useState<Room[]>([])
  const [hotelName, setHotelName] = useState('Hotel')
  const [loading,   setLoading]   = useState(true)
  const [error,    _setError]     = useState('')

  // Booking modal
  const [bookRoom,    setBookRoom]    = useState<Room | null>(null)
  const [form,        setForm]        = useState<BookForm>({ name: '', phone: '', email: '', checkIn: '', checkOut: '', guests: '1', message: '' })
  const [submitting,  setSubmitting]  = useState(false)
  const [submitted,   setSubmitted]   = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Carousel
  const [page, setPage] = useState(0)
  const CARDS_PER_PAGE  = 3

  useEffect(() => {
    if (!tenantId) { setLoading(false); return }

    async function loadData() {
      setLoading(true)
      const [roomsRes, configRes] = await Promise.all([
        pub.from('rooms').select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .eq('status', 'available')
          .order('type').order('name'),
        pub.from('site_config').select('config_value')
          .eq('tenant_id', tenantId)
          .eq('config_key', 'hotel_name')
          .maybeSingle(),
      ])
      setRooms((roomsRes.data ?? []) as Room[])
      if (configRes.data?.config_value) setHotelName(configRes.data.config_value)
      setLoading(false)
    }
    loadData().catch(() => setLoading(false))
  }, [tenantId])

  const openBooking = useCallback((room: Room) => {
    setBookRoom(room)
    setForm({ name: '', phone: '', email: '', checkIn: '', checkOut: '', guests: '1', message: '' })
    setSubmitted(false)
    setSubmitError('')
  }, [])

  const handleBook = async () => {
    if (!form.name.trim())       { setSubmitError('Please enter your name.'); return }
    if (form.phone.replace(/\D/g,'').length < 10) { setSubmitError('Please enter a valid 10-digit phone number.'); return }
    if (!form.checkIn)            { setSubmitError('Please select a check-in date.'); return }
    if (!bookRoom || !tenantId)   return

    setSubmitting(true); setSubmitError('')

    const nights = form.checkOut
      ? Math.max(1, Math.round((new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / 86400000))
      : 1
    const subtotal = bookRoom.price_per_night * nights
    const gst      = Math.round(subtotal * 0.12)
    const total    = subtotal + gst

    const extId = genRefId()

    const { error: insertError } = await pub.from('third_party_orders').insert({
      tenant_id:        tenantId,
      platform:         'other',
      external_order_id: extId,
      customer_name:    form.name.trim(),
      customer_phone:   form.phone.trim(),
      delivery_address: `Direct Website Booking | Room: ${bookRoom.type} (${bookRoom.name}) | Check-in: ${form.checkIn} | Check-out: ${form.checkOut || 'TBD'} | Guests: ${form.guests}${form.message ? ` | Note: ${form.message}` : ''}`,
      items: JSON.stringify([{
        name:   `${bookRoom.type} — ${bookRoom.name}`,
        nights,
        price:  bookRoom.price_per_night,
      }]),
      subtotal,
      platform_fee: gst,
      total,
      status:   'new',
      is_read:  false,
    })

    if (insertError) {
      setSubmitError('Could not send booking request. Please call us directly.')
    } else {
      setSubmitted(true)
    }
    setSubmitting(false)
  }

  const today = new Date().toISOString().split('T')[0]

  // Pagination
  const types = [...new Set(rooms.map(r => r.type))].sort((a, b) => {
    const minA = Math.min(...rooms.filter(r => r.type === a).map(r => r.price_per_night))
    const minB = Math.min(...rooms.filter(r => r.type === b).map(r => r.price_per_night))
    return minA - minB
  })
  const paged = types.slice(page * CARDS_PER_PAGE, page * CARDS_PER_PAGE + CARDS_PER_PAGE)
  const totalPages = Math.ceil(types.length / CARDS_PER_PAGE)

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <p className="text-gray-400">No hotel specified. Please use a valid booking link.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Hero */}
      <div className="bg-gradient-to-b from-[#050A14] to-[#0F172A] pt-16 pb-10 px-4 text-center">
        <div className="w-12 h-12 bg-[#0066CC] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Hotel className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{hotelName}</h1>
        <p className="text-gray-400 text-sm">Browse available rooms and book directly — instant confirmation</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading rooms...
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-gray-400">{error}</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20">
            <Bed className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No rooms available for booking right now.</p>
            <p className="text-gray-600 text-xs mt-1">Please call us to check availability.</p>
          </div>
        ) : (
          <>
            <p className="text-center text-sm text-gray-500 mb-8">
              {rooms.length} room{rooms.length !== 1 ? 's' : ''} available
            </p>

            {/* Room type cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paged.map(type => {
                const typeRooms = rooms.filter(r => r.type === type)
                const minPrice  = Math.min(...typeRooms.map(r => r.price_per_night))
                const sample    = typeRooms[0]
                const badge     = TYPE_BADGE[type]
                return (
                  <div key={type}
                    className="bg-[#050A14] border border-white/[0.07] rounded-2xl overflow-hidden hover:border-[#0066CC]/40 transition-all group">
                    {/* Room image or colour band */}
                    {sample.image_url ? (
                      <div className="relative h-44 w-full overflow-hidden">
                        <img src={sample.image_url} alt={type} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050A14]/80 to-transparent" />
                        {badge && (
                          <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] bg-amber-500/80 text-white px-2 py-0.5 rounded-full">
                            <Star className="w-2.5 h-2.5" /> {badge}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-2 bg-gradient-to-r from-[#0066CC] to-[#0099FF]" />
                    )}
                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-white text-base">{type}</p>
                          {badge && !sample.image_url && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full mt-1">
                              <Star className="w-2.5 h-2.5" /> {badge}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-[#0066CC]">&#8377;{minPrice.toLocaleString('en-IN')}</p>
                          <p className="text-[10px] text-gray-500">per night</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {type}</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Up to {sample.capacity} guests</span>
                      </div>

                      {/* Amenities */}
                      {(sample.amenities ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {(sample.amenities ?? []).slice(0,4).map(a => {
                            const Icon = AMENITY_ICONS[a]
                            return (
                              <span key={a} className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-white/5 text-gray-400 rounded-full">
                                {Icon && <Icon className="w-2.5 h-2.5" />}
                                {a}
                              </span>
                            )
                          })}
                        </div>
                      )}

                      {/* Description */}
                      {sample.description && (
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{sample.description}</p>
                      )}

                      {/* Available count */}
                      <p className="text-[11px] text-green-400">
                        &#10003; {typeRooms.length} room{typeRooms.length !== 1 ? 's' : ''} available
                      </p>

                      {/* Book button */}
                      <button
                        onClick={() => openBooking(typeRooms[0])}
                        className="w-full bg-[#0066CC] hover:bg-[#0055BB] text-white font-semibold text-sm py-3 rounded-xl transition-all active:scale-[0.98]"
                      >
                        Book {type}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-500">{page+1} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page === totalPages-1}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Booking Modal ─────────────────────────────────────────────────── */}
      {bookRoom && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            {!submitted ? (
              <>
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                  <div>
                    <p className="font-bold text-white">Book {bookRoom.type}</p>
                    <p className="text-xs text-gray-500">&#8377;{bookRoom.price_per_night.toLocaleString('en-IN')} / night &middot; {bookRoom.name}</p>
                  </div>
                  <button onClick={() => setBookRoom(null)} className="text-gray-500 hover:text-white transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {submitError && (
                    <div className="flex items-start gap-2 text-red-400 text-xs bg-red-500/10 px-3 py-2.5 rounded-xl">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {submitError}
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Full Name *</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Your name"
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white text-sm rounded-xl placeholder-gray-600 focus:outline-none focus:border-[#0066CC]/50"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Phone *
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white text-sm rounded-xl placeholder-gray-600 focus:outline-none focus:border-[#0066CC]/50"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email (optional)
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white text-sm rounded-xl placeholder-gray-600 focus:outline-none focus:border-[#0066CC]/50"
                    />
                  </div>

                  {/* Dates + guests */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" /> Check-in *
                      </label>
                      <input
                        type="date"
                        min={today}
                        value={form.checkIn}
                        onChange={e => setForm(p => ({ ...p, checkIn: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white text-sm rounded-xl focus:outline-none focus:border-[#0066CC]/50 [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" /> Check-out
                      </label>
                      <input
                        type="date"
                        min={form.checkIn || today}
                        value={form.checkOut}
                        onChange={e => setForm(p => ({ ...p, checkOut: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white text-sm rounded-xl focus:outline-none focus:border-[#0066CC]/50 [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  {/* Guests */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Number of Guests</label>
                    <select
                      value={form.guests}
                      onChange={e => setForm(p => ({ ...p, guests: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white text-sm rounded-xl focus:outline-none focus:border-[#0066CC]/50 [color-scheme:dark]"
                    >
                      {Array.from({ length: bookRoom.capacity }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Special Requests (optional)</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                      placeholder="Any special requirements..."
                      rows={2}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white text-sm rounded-xl placeholder-gray-600 focus:outline-none focus:border-[#0066CC]/50 resize-none"
                    />
                  </div>

                  {/* Price estimate */}
                  {form.checkIn && form.checkOut && (() => {
                    const nights = Math.max(1, Math.round(
                      (new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / 86400000
                    ))
                    const sub  = bookRoom.price_per_night * nights
                    const gst  = Math.round(sub * 0.12)
                    return (
                      <div className="bg-[#0066CC]/10 border border-[#0066CC]/20 rounded-xl px-4 py-3 text-xs space-y-1">
                        <div className="flex justify-between text-gray-300">
                          <span>&#8377;{bookRoom.price_per_night.toLocaleString('en-IN')} &times; {nights} night{nights > 1 ? 's' : ''}</span>
                          <span>&#8377;{sub.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>GST (12%)</span>
                          <span>&#8377;{gst.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between font-bold text-white border-t border-white/10 pt-1 mt-1">
                          <span>Estimated Total</span>
                          <span>&#8377;{(sub + gst).toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-gray-500 text-[10px] pt-0.5">Final amount confirmed at check-in</p>
                      </div>
                    )
                  })()}

                  <button
                    onClick={handleBook}
                    disabled={submitting}
                    className="w-full bg-[#0066CC] hover:bg-[#0055BB] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2"
                  >
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending Request...</> : 'Send Booking Request'}
                  </button>
                  <p className="text-[10px] text-gray-600 text-center">
                    We will contact you within a few hours to confirm availability.
                  </p>
                </div>
              </>
            ) : (
              /* Success */
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/15 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white mb-1">Booking Request Sent!</p>
                  <p className="text-sm text-gray-400">
                    Thank you, <strong className="text-white">{form.name}</strong>. We have received your booking request for a <strong className="text-white">{bookRoom.type}</strong> room.
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  Our team will contact you at <strong className="text-gray-300">{form.phone}</strong> within a few hours to confirm availability and arrange payment.
                </p>
                <button
                  onClick={() => setBookRoom(null)}
                  className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#0066CC]" />
      </div>
    }>
      <BookPage />
    </Suspense>
  )
}
