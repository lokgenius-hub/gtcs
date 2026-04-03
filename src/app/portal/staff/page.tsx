'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, Clock, CheckCircle2, XCircle, Loader2, Calendar,
  Plus, X, Pencil, Trash2, UserCheck, AlertCircle,
} from 'lucide-react'
import { portalSupabase, getPortalSession, type StaffMember, type AttendanceRecord } from '@/lib/portal-db'

type DraftStaff = { name: string; role: string; phone: string; shift: string; monthly_salary: number; is_active: boolean }
const BLANK_STAFF: DraftStaff = { name: '', role: '', phone: '', shift: 'morning', monthly_salary: 0, is_active: true }

export default function PortalStaff() {
  const router = useRouter()
  const [tenantId,  setTid]     = useState('')
  const [staff,     setStaff]   = useState<StaffMember[]>([])
  const [attend,    setAttend]  = useState<AttendanceRecord[]>([])
  const [loading,   setLoad]    = useState(true)
  const [tab,       setTab]     = useState<'staff' | 'attendance'>('staff')

  /* form state */
  const [panel,  setPanel]  = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form,   setForm]   = useState<DraftStaff>(BLANK_STAFF)
  const [saving, setSaving] = useState(false)
  const [toast,  setToast]  = useState<{ ok: boolean; msg: string } | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  async function load(tid: string) {
    const [sRes, aRes] = await Promise.all([
      portalSupabase.from('staff_members').select('*').eq('tenant_id', tid).order('name'),
      portalSupabase.from('staff_attendance').select('*').eq('tenant_id', tid).eq('date', today),
    ])
    setStaff(sRes.data ?? [])
    setAttend(aRes.data ?? [])
  }

  useEffect(() => {
    getPortalSession().then(sess => {
      if (!sess) { router.replace('/portal'); return }
      setTid(sess.tenantId)
      load(sess.tenantId).finally(() => setLoad(false))
    })
  }, [router])

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg }); setTimeout(() => setToast(null), 3500)
  }

  function openAdd() { setForm(BLANK_STAFF); setEditId(null); setPanel(true) }
  function openEdit(s: StaffMember) {
    setForm({ name: s.name, role: s.role, phone: s.phone || '', shift: s.shift,
              monthly_salary: s.monthly_salary, is_active: s.is_active })
    setEditId(s.id); setPanel(true)
  }

  async function saveStaff() {
    if (!form.name.trim() || !form.role.trim()) { showToast(false, 'Name and role are required'); return }
    setSaving(true)
    if (editId) {
      const { error } = await portalSupabase.from('staff_members')
        .update({ ...form, name: form.name.trim(), role: form.role.trim() })
        .eq('id', editId).eq('tenant_id', tenantId)
      if (error) { showToast(false, error.message); setSaving(false); return }
      showToast(true, 'Staff updated')
    } else {
      const { error } = await portalSupabase.from('staff_members')
        .insert({ ...form, name: form.name.trim(), role: form.role.trim(), tenant_id: tenantId })
      if (error) { showToast(false, error.message); setSaving(false); return }
      showToast(true, 'Staff added')
    }
    await load(tenantId)
    setSaving(false); setPanel(false)
  }

  async function deleteStaff(id: string) {
    if (!confirm('Remove this staff member?')) return
    await portalSupabase.from('staff_members').delete().eq('id', id).eq('tenant_id', tenantId)
    showToast(true, 'Removed')
    await load(tenantId)
  }

  async function markAttendance(s: StaffMember, status: 'present' | 'absent') {
    const existing = attend.find(a => a.staff_id === s.id)
    if (existing) {
      await portalSupabase.from('staff_attendance')
        .update({ status, check_in: status === 'present' ? new Date().toISOString() : null })
        .eq('id', existing.id).eq('tenant_id', tenantId)
    } else {
      await portalSupabase.from('staff_attendance').insert({
        tenant_id: tenantId, staff_id: s.id, staff_name: s.name,
        date: today, status,
        check_in: status === 'present' ? new Date().toISOString() : null,
      })
    }
    await load(tenantId)
  }

  const presentToday = attend.filter(a => a.status === 'present').length
  const absentToday  = staff.length - presentToday

  const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0066CC]'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0066CC]" /> Staff Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{staff.length} total members</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {(['staff', 'attendance'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all
                  ${tab === t ? 'bg-[#0066CC] text-white' : 'text-gray-400 hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#0066CC] text-white hover:bg-[#0055AA] transition">
            <Plus className="w-3.5 h-3.5" /> Add Staff
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl text-sm font-medium border
          ${toast.ok ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Add/Edit Panel */}
      {panel && (
        <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">{editId ? 'Edit Staff' : 'Add Staff Member'}</h2>
            <button onClick={() => setPanel(false)}><X className="w-4 h-4 text-gray-400 hover:text-white" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] text-gray-400 mb-1 block">Full Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Raju Kumar" className={inp} />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 mb-1 block">Role *</label>
              <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                placeholder="e.g. Waiter, Cook, Manager" list="role-list" className={inp} />
              <datalist id="role-list">
                {['Waiter', 'Cook', 'Manager', 'Cashier', 'Cleaner', 'Security', 'Delivery'].map(r => <option key={r} value={r} />)}
              </datalist>
            </div>
            <div>
              <label className="text-[11px] text-gray-400 mb-1 block">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91-XXXXXXXXXX" type="tel" className={inp} />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 mb-1 block">Shift</label>
              <select value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value }))}
                className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0066CC]">
                {['morning', 'afternoon', 'evening', 'night', 'full'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-gray-400 mb-1 block">Monthly Salary (₹)</label>
              <input type="number" min="0" value={form.monthly_salary || ''}
                onChange={e => setForm(f => ({ ...f, monthly_salary: Number(e.target.value) || 0 }))}
                placeholder="0" className={inp} />
            </div>
            {editId && (
              <div className="flex items-center gap-2">
                <input id="active-staff" type="checkbox" checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-[#0066CC] w-4 h-4" />
                <label htmlFor="active-staff" className="text-xs text-gray-300">Active</label>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={saveStaff} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0066CC] text-white hover:bg-[#0055AA] disabled:opacity-50 transition">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {editId ? 'Save Changes' : 'Add Staff'}
            </button>
            <button onClick={() => setPanel(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Staff',   value: staff.length,  color: '#0066CC', icon: Users        },
          { label: 'Present Today', value: presentToday,  color: '#16A34A', icon: CheckCircle2 },
          { label: 'Absent Today',  value: absentToday,   color: '#EF4444', icon: XCircle      },
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
            <div className="text-center py-16">
              <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-3">No staff members yet.</p>
              <button onClick={openAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0066CC] text-white hover:bg-[#0055AA] transition">
                <Plus className="w-3.5 h-3.5" /> Add First Member
              </button>
            </div>
          ) : staff.map(s => (
            <div key={s.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0066CC]/20 flex items-center justify-center text-[#0066CC] font-bold text-xs">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{s.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{s.role} · {s.shift} shift{s.phone ? ` · ${s.phone}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  {s.monthly_salary > 0 && <p className="text-xs text-gray-400">₹{s.monthly_salary.toLocaleString('en-IN')}/mo</p>}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-500'}`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg bg-white/5 hover:bg-[#0066CC]/20 text-gray-400 hover:text-[#0066CC] transition"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteStaff(s.id)} className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attendance */}
      {tab === 'attendance' && !loading && (
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <Calendar className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div className="space-y-2">
            {staff.length === 0 ? (
              <p className="text-center text-gray-500 py-12">Add staff members first.</p>
            ) : staff.map(s => {
              const rec = attend.find(a => a.staff_id === s.id)
              const status = rec?.status || 'absent'
              return (
                <div key={s.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{s.name}</p>
                    <p className="text-xs text-gray-500 capitalize flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {rec?.check_in
                        ? `In: ${new Date(rec.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                        : 'Not marked'}
                      {rec?.check_out ? ` · Out: ${new Date(rec.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      status === 'present' ? 'bg-green-500/10 text-green-400' :
                      status === 'late'    ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'}`}>
                      {status}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => markAttendance(s, 'present')}
                        className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition" title="Mark Present">
                        <UserCheck className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => markAttendance(s, 'absent')}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition" title="Mark Absent">
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

