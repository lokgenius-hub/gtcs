'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Hotel, Plus, Pencil, X, Save, Bed, Trash2, Loader2,
  Users, DollarSign, Wifi, Tv, Wind, CheckCircle2, Upload, Image as ImageIcon,
} from 'lucide-react'
import { portalSupabase, getPortalSession } from '@/lib/portal-db'

type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning'

interface Room {
  id: string
  tenant_id: string
  name: string
  type: string
  capacity: number
  price_per_night: number
  status: RoomStatus
  amenities?: string[]
  image_url?: string
  description?: string
  is_active: boolean
}

const blank = (tenantId: string): Partial<Room> => ({
  tenant_id: tenantId,
  name:  '',
  type:  'Standard',
  capacity: 2,
  price_per_night: 2500,
  status: 'available',
  is_active: true,
  amenities: [],
  image_url: '',
})

const ROOM_TYPES      = ['Standard', 'Deluxe', 'Suite', 'Executive', 'Presidential', 'Banquet', 'Conference']
const STATUSES: RoomStatus[] = ['available', 'occupied', 'maintenance', 'cleaning']
const AMENITIES_LIST  = ['wifi', 'ac', 'tv', 'geyser', 'minibar', 'balcony', 'jacuzzi', 'pool-access']

const statusStyle: Record<RoomStatus, string> = {
  available:   'bg-green-500/15  text-green-400  border-green-500/20',
  occupied:    'bg-blue-500/15   text-blue-400   border-blue-500/20',
  maintenance: 'bg-red-500/15    text-red-400    border-red-500/20',
  cleaning:    'bg-amber-500/15  text-amber-400  border-amber-500/20',
}
const statusDot: Record<RoomStatus, string> = {
  available:   'bg-green-500',
  occupied:    'bg-blue-500',
  maintenance: 'bg-red-500',
  cleaning:    'bg-amber-500',
}

export default function PortalRooms() {
  const [tenantId, setTid]   = useState('')
  const [rooms,    setRooms] = useState<Room[]>([])
  const [loading,        setLoad]        = useState(true)
  const [editing,        setEdit]        = useState<Partial<Room> | null>(null)
  const [isNew,          setIsNew]       = useState(false)
  const [saving,         setSave]        = useState(false)
  const [errMsg,         setErr]         = useState('')
  const [imageUploading, setImgUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadImage = async (file: File, tid: string, roomType: string) => {
    setImgUploading(true)
    try {
      const ext  = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const safe = (roomType || 'room').toLowerCase().replace(/[^a-z0-9]/g, '-')
      const path = `${tid}/${safe}-${Date.now()}.${ext}`
      const { error } = await portalSupabase.storage
        .from('room-images')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw new Error(error.message)
      const { data } = portalSupabase.storage.from('room-images').getPublicUrl(path)
      setEdit(p => ({ ...p!, image_url: data.publicUrl }))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Image upload failed')
    }
    setImgUploading(false)
  }

  const load = useCallback(async (tid: string) => {
    setLoad(true)
    const { data } = await portalSupabase
      .from('rooms')
      .select('*')
      .eq('tenant_id', tid)
      .eq('is_active', true)
      .order('type').order('name')
    setRooms((data ?? []) as Room[])
    setLoad(false)
  }, [])

  useEffect(() => {
    getPortalSession().then(sess => {
      if (!sess) return
      setTid(sess.tenantId)
      load(sess.tenantId)
    })
  }, [load])

  const updateStatus = async (id: string, status: RoomStatus) => {
    await portalSupabase.from('rooms').update({ status }).eq('id', id)
    setRooms(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  const save = async () => {
    if (!editing || !tenantId) return
    if (!editing.name?.trim()) { setErr('Room name is required'); return }
    setSave(true); setErr('')
    try {
      if (isNew) {
        const { id, ...rest } = editing; void id
        const { error } = await portalSupabase.from('rooms').insert({ ...rest, tenant_id: tenantId })
        if (error) throw error
      } else {
        const { id, ...rest } = editing
        if (!id) return
        const { error } = await portalSupabase.from('rooms').update(rest).eq('id', id).eq('tenant_id', tenantId)
        if (error) throw error
      }
      setEdit(null)
      await load(tenantId)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed')
    }
    setSave(false)
  }

  const remove = async (id: string) => {
    if (!confirm('Remove this room from the list?')) return
    await portalSupabase.from('rooms').update({ is_active: false }).eq('id', id).eq('tenant_id', tenantId)
    setRooms(prev => prev.filter(r => r.id !== id))
  }

  const toggleAmenity = (a: string) => {
    setEdit(prev => {
      if (!prev) return prev
      const list = prev.amenities ?? []
      return {
        ...prev,
        amenities: list.includes(a) ? list.filter(x => x !== a) : [...list, a],
      }
    })
  }

  // Stats
  const stats = STATUSES.map(s => ({ status: s, count: rooms.filter(r => r.status === s).length }))

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Hotel className="w-5 h-5 text-[#0066CC]" /> Rooms
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage room availability and pricing. Rooms marked &quot;available&quot; appear on the booking page.
          </p>
        </div>
        <button
          onClick={() => { setEdit(blank(tenantId)); setIsNew(true); setErr('') }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0066CC] text-white rounded-xl text-sm font-semibold hover:bg-[#0055BB] transition"
        >
          <Plus className="w-4 h-4" /> Add Room
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ status, count }) => (
          <div key={status} className={`p-3 rounded-xl border ${statusStyle[status]} text-center`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs capitalize mt-0.5 opacity-70">{status}</p>
          </div>
        ))}
      </div>

      {/* Room type summary */}
      {rooms.length > 0 && (
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Room Types</p>
          <div className="flex flex-wrap gap-2">
            {[...new Set(rooms.map(r => r.type))].map(type => {
              const count = rooms.filter(r => r.type === type).length
              return (
                <div key={type} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0066CC]/10 border border-[#0066CC]/20 text-[#0066CC] text-xs">
                  <span className="font-semibold">{type}</span>
                  <span className="text-[#0066CC]/50">({count})</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading rooms...
        </div>
      )}

      {!loading && rooms.length === 0 && (
        <div className="text-center py-16">
          <Bed className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No rooms added yet.</p>
          <p className="text-gray-600 text-xs mt-1">Add rooms above so they appear on the hotel booking page.</p>
        </div>
      )}

      {/* Rooms grid */}
      {!loading && rooms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rooms.map(room => (
            <div key={room.id} className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
              {/* Room image */}
              {room.image_url ? (
                <div className="relative h-36 w-full overflow-hidden">
                  <img src={room.image_url} alt={room.type} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${statusStyle[room.status]}`}>{room.status}</span>
                </div>
              ) : (
                <div className="h-1.5 bg-gradient-to-r from-[#0066CC] to-[#0099FF]" />
              )}
              <div className="p-4 space-y-3">
              {/* Room header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/90 font-semibold flex items-center gap-2">
                    <Bed className="w-4 h-4 text-[#0066CC]" />
                    {room.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>{room.type}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {room.capacity} guests</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> &#8377;{room.price_per_night.toLocaleString('en-IN')}/night</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button onClick={() => { setEdit({ ...room }); setIsNew(false); setErr('') }}
                    className="p-1.5 bg-white/5 hover:bg-white/10 text-white/50 rounded-lg transition">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(room.id)}
                    className="p-1.5 bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-lg transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Amenities */}
              {(room.amenities ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(room.amenities ?? []).map(a => {
                    const Icon = a === 'wifi' ? Wifi : a === 'tv' ? Tv : a === 'ac' ? Wind : null
                    return (
                      <span key={a} className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-white/5 text-gray-400 rounded-full border border-white/5">
                        {Icon && <Icon className="w-2.5 h-2.5" />}
                        {a}
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Status quick-change */}
              <div className="flex gap-1 flex-wrap">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(room.id, s)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition capitalize border
                      ${room.status === s
                        ? statusStyle[s]
                        : 'bg-white/3 border-white/5 text-gray-600 hover:text-gray-400'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${room.status === s ? statusDot[s] : 'bg-gray-600'}`} />
                    {s}
                  </button>
                ))}
              </div>
              </div>{/* end inner p-4 */}
            </div>
          ))}
        </div>
      )}

      {/* ── Edit / Add modal ────────────────────────────────────────────── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h3 className="font-bold text-white">{isNew ? 'Add New Room' : 'Edit Room'}</h3>
              <button onClick={() => setEdit(null)} className="text-gray-500 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {errMsg && (
                <p className="text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded-xl">{errMsg}</p>
              )}

              {/* Room name */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Room Name *</label>
                <input
                  value={editing.name || ''}
                  onChange={e => setEdit(p => ({ ...p!, name: e.target.value }))}
                  placeholder="e.g. Room 101, Pool Villa A"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white text-sm rounded-xl placeholder-gray-600 focus:outline-none focus:border-[#0066CC]/50"
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Room Type</label>
                <div className="flex flex-wrap gap-2">
                  {ROOM_TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => setEdit(p => ({ ...p!, type: t }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition border
                        ${editing.type === t
                          ? 'bg-[#0066CC]/20 border-[#0066CC]/50 text-[#0066CC]'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Capacity + Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Capacity (guests)</label>
                  <input
                    type="number" min="1" max="20"
                    value={editing.capacity || 2}
                    onChange={e => setEdit(p => ({ ...p!, capacity: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white text-sm rounded-xl focus:outline-none focus:border-[#0066CC]/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Price per night (&#8377;)</label>
                  <input
                    type="number" min="0"
                    value={editing.price_per_night || 0}
                    onChange={e => setEdit(p => ({ ...p!, price_per_night: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white text-sm rounded-xl focus:outline-none focus:border-[#0066CC]/50"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Status</label>
                <div className="flex gap-2 flex-wrap">
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => setEdit(p => ({ ...p!, status: s }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize border transition
                        ${editing.status === s ? statusStyle[s] : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES_LIST.map(a => {
                    const active = (editing.amenities ?? []).includes(a)
                    return (
                      <button
                        key={a}
                        onClick={() => toggleAmenity(a)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize border transition
                          ${active ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                      >
                        {active && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                        {a}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Image upload */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  Room Photo
                  <span className="text-gray-600 ml-1">(one photo per room type · shown on booking page)</span>
                </label>

                {/* Preview */}
                {editing.image_url ? (
                  <div className="relative rounded-xl overflow-hidden h-36 w-full mb-2 group">
                    <img
                      src={editing.image_url}
                      alt="Room preview"
                      className="w-full h-full object-cover"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 text-black rounded-lg text-xs font-semibold hover:bg-white transition"
                      >
                        <Upload className="w-3.5 h-3.5" /> Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => setEdit(p => ({ ...p!, image_url: '' }))}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/80 text-white rounded-lg text-xs font-semibold hover:bg-red-500 transition"
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                    className="w-full h-28 border-2 border-dashed border-white/10 hover:border-[#0066CC]/50 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-300 transition disabled:opacity-50"
                  >
                    {imageUploading
                      ? <><Loader2 className="w-5 h-5 animate-spin" /><span className="text-xs">Uploading...</span></>
                      : <><ImageIcon className="w-6 h-6" /><span className="text-xs">Click to upload photo</span><span className="text-[10px] text-gray-600">JPG, PNG, WebP · max 5 MB</span></>}
                  </button>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) uploadImage(file, tenantId, editing?.type || 'room')
                    e.target.value = ''
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Description (optional)</label>
                <textarea
                  value={editing.description || ''}
                  onChange={e => setEdit(p => ({ ...p!, description: e.target.value }))}
                  placeholder="Short description shown to guests..."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white text-sm rounded-xl placeholder-gray-600 focus:outline-none focus:border-[#0066CC]/50 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setEdit(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition">
                  Cancel
                </button>
                <button onClick={save} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0066CC] text-white text-sm font-semibold hover:bg-[#0055BB] disabled:opacity-50 transition">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Room'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
