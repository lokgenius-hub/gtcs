'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Clock, CheckCircle2, XCircle, Loader2, Calendar } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_SAAS_API_URL || 'http://localhost:4000'
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('hf_token')}` })

type StaffMember = { id: string; name: string; role: string; phone?: string; salary?: number; is_active: boolean }
type AttendanceRecord = { staff_id: string; staff_name: string; date: string; check_in?: string; check_out?: string; hours_worked?: number; status: string }

export default function PortalStaff() {
  const router = useRouter()
  const [staff, setStaff]         = useState<StaffMember[]>([])
  const [attendance, setAttend]   = useState<AttendanceRecord[]>([])
  const [loading, setLoad]        = useState(true)
  const [tab, setTab]             = useState<'staff' | 'attendance'>('staff')

  useEffect(() => {
    async function load() {
      setLoad(true)
      try {
        const [sRes, aRes] = await Promise.all([
          fetch(`${API}/api/v1/staff`, { headers: authHeaders() }),
          fetch(`${API}/api/v1/staff/attendance?period=today`, { headers: authHeaders() }),
        ])
        if (sRes.status === 401) { router.replace('/portal'); return }
        const [sd, ad] = await Promise.all([sRes.json(), aRes.json()])
        setStaff(sd.data?.staff || [])
        setAttend(ad.data?.attendance || [])
      } catch { /* offline */ }
      finally { setLoad(false) }
    }
    load()
  }, [router])

  const presentToday = attendance.filter(a => a.check_in).length
  const absentToday  = staff.length - presentToday

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-[#0066CC]" /> Staff Management
        </h1>
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {(['staff', 'attendance'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all
                ${tab === t ? 'bg-[#0066CC] text-white' : 'text-gray-400 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Staff',    value: staff.length,   color: '#0066CC', icon: Users        },
          { label: 'Present Today',  value: presentToday,   color: '#16A34A', icon: CheckCircle2 },
          { label: 'Absent Today',   value: absentToday,    color: '#EF4444', icon: XCircle      },
        ].map(c => (
          <div key={c.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <c.icon className="w-5 h-5 mx-auto mb-1" style={{ color: c.color }} />
            <p className="text-xl font-extrabold text-white">{c.value}</p>
            <p className="text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      {loading && <div className="flex gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}

      {/* Staff list */}
      {tab === 'staff' && !loading && (
        <div className="space-y-2">
          {staff.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No staff members. Add via the desktop app or API.</p>
          ) : staff.map(s => (
            <div key={s.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0066CC]/20 flex items-center justify-center text-[#0066CC] font-bold text-xs">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{s.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{s.role} {s.phone ? `· ${s.phone}` : ''}</p>
                </div>
              </div>
              <div className="text-right">
                {s.salary && <p className="text-xs text-gray-400">₹{s.salary.toLocaleString('en-IN')}/mo</p>}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-500'}`}>
                  {s.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attendance view */}
      {tab === 'attendance' && !loading && (
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <Calendar className="w-3.5 h-3.5" />
            Today&apos;s attendance
          </div>
          <div className="space-y-2">
            {attendance.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No attendance records for today.</p>
            ) : attendance.map(a => (
              <div key={`${a.staff_id}-${a.date}`} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">{a.staff_name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {a.check_in ? `In: ${a.check_in}` : 'Not checked in'}
                    {a.check_out ? ` · Out: ${a.check_out}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  {a.hours_worked != null && (
                    <p className="text-xs text-gray-400">{a.hours_worked.toFixed(1)} hrs</p>
                  )}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    a.status === 'present' ? 'bg-green-500/10 text-green-400' :
                    a.status === 'late'    ? 'bg-amber-500/10 text-amber-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {a.status || 'absent'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
