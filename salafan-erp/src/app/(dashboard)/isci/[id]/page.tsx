'use client'
import useSWR from 'swr'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Activity, Printer, Scissors, RefreshCw, Eye, EyeOff,
  Plus, X, Clock, Calendar,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { toast } from '@/hooks/use-toast'
import { formatDate, formatNumber, shiftTypeLabels } from '@/lib/utils'

const fetcher = (u: string) => fetch(u).then((r) => r.json())

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
]

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function IsciDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: worker, mutate: mutateWorker } = useSWR(`/api/isciler/${id}`, fetcher)

  const [editForm, setEditForm] = useState<Record<string, string | boolean> | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  const [month, setMonth] = useState(currentMonth())
  const { data: shifts = [], mutate: mutateShifts } = useSWR(
    `/api/novbeler?userId=${id}&month=${month}`,
    fetcher,
  )

  const [showShiftModal, setShowShiftModal] = useState(false)
  const [shiftForm, setShiftForm] = useState({
    date: new Date().toISOString().split('T')[0],
    shiftType: 'MORNING',
    startTime: '',
    endTime: '',
    notes: '',
  })
  const [savingShift, setSavingShift] = useState(false)

  if (!worker) {
    return <div className="animate-pulse h-64 bg-muted rounded-2xl" />
  }

  const totalHours = shifts.reduce((sum: number, s: any) => sum + (s.hoursWorked ?? 0), 0)

  const startEdit = () => {
    setEditForm({
      name: worker.name,
      position: worker.position ?? '',
      phone: worker.phone ?? '',
      role: worker.role,
      isActive: worker.isActive,
    })
  }

  const saveProfile = async () => {
    if (!editForm) return
    setSavingProfile(true)
    try {
      const res = await fetch(`/api/isciler/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Profil yeniləndi' })
      setEditForm(null)
      mutateWorker()
    } catch {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' })
    } finally {
      setSavingProfile(false)
    }
  }

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'Şifrə ən azı 6 simvol olmalıdır', variant: 'destructive' })
      return
    }
    setSavingPw(true)
    try {
      const res = await fetch(`/api/isciler/${id}/sifre`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Şifrə dəyişdirildi' })
      setNewPassword('')
    } catch {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' })
    } finally {
      setSavingPw(false)
    }
  }

  const addShift = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingShift(true)
    try {
      const dateStr = shiftForm.date
      const startDateTime = `${dateStr}T${shiftForm.startTime}:00`
      const endDateTime = shiftForm.endTime ? `${dateStr}T${shiftForm.endTime}:00` : null

      const res = await fetch('/api/novbeler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: id,
          shiftType: shiftForm.shiftType,
          date: new Date(dateStr).toISOString(),
          startTime: new Date(startDateTime).toISOString(),
          endTime: endDateTime ? new Date(endDateTime).toISOString() : null,
          notes: shiftForm.notes || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Növbə əlavə edildi' })
      setShowShiftModal(false)
      setShiftForm({ date: new Date().toISOString().split('T')[0], shiftType: 'MORNING', startTime: '', endTime: '', notes: '' })
      mutateShifts()
    } catch {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' })
    } finally {
      setSavingShift(false)
    }
  }

  return (
    <div>
      <Link href="/isci" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Geri
      </Link>

      <PageHeader title={worker.name} description={worker.position ?? worker.email} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-3 ${avatarColor(worker.name)}`}>
                {getInitials(worker.name)}
              </div>
              <h2 className="font-semibold text-lg">{worker.name}</h2>
              <p className="text-sm text-muted-foreground">{worker.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  worker.role === 'ADMIN'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {worker.role === 'ADMIN' ? 'Admin' : 'İşçi'}
                </span>
                {worker.isActive ? (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Aktiv
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800">Deaktiv</span>
                )}
              </div>
            </div>

            {editForm ? (
              <div className="space-y-3">
                {[
                  { label: 'Ad Soyad', key: 'name' },
                  { label: 'Vəzifə', key: 'position' },
                  { label: 'Telefon', key: 'phone' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
                    <input
                      value={editForm[f.key] as string}
                      onChange={(e) => setEditForm((p) => ({ ...p!, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Rol</label>
                  <select
                    value={editForm.role as string}
                    onChange={(e) => setEditForm((p) => ({ ...p!, role: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="WORKER">İşçi</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editForm.isActive as boolean}
                    onChange={(e) => setEditForm((p) => ({ ...p!, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="isActive" className="text-sm">Aktiv</label>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveProfile}
                    disabled={savingProfile}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium"
                  >
                    {savingProfile ? 'Saxlanır...' : 'Saxla'}
                  </button>
                  <button
                    onClick={() => setEditForm(null)}
                    className="px-4 py-2 border border-border rounded-xl text-sm hover:bg-accent"
                  >
                    Ləğv
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                {worker.position && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vəzifə</span>
                    <span>{worker.position}</span>
                  </div>
                )}
                {worker.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telefon</span>
                    <span>{worker.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Qeydiyyat</span>
                  <span>{formatDate(worker.createdAt)}</span>
                </div>
                <button
                  onClick={startEdit}
                  className="w-full mt-3 py-2 border border-border rounded-xl text-sm hover:bg-accent transition-colors"
                >
                  Redaktə Et
                </button>
              </div>
            )}
          </div>

          {/* Password change */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5">
            <h3 className="font-semibold text-sm mb-3">Şifrəni Dəyiş</h3>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Yeni şifrə (min 6 simvol)"
                  className="w-full px-3 py-2 pr-10 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={changePassword}
                disabled={savingPw || !newPassword}
                className="w-full py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium"
              >
                {savingPw ? 'Dəyişdirilir...' : 'Şifrəni Dəyiş'}
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'İstehsal Runları', value: worker._count?.productionRuns ?? 0, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
              { label: 'Çap İşləri', value: worker._count?.printJobs ?? 0, icon: Printer, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30' },
              { label: 'Kəsmə İşləri', value: worker._count?.cuttingJobs ?? 0, icon: Scissors, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/30' },
              { label: 'Geri Dönüşüm', value: worker._count?.recyclingBatches ?? 0, icon: RefreshCw, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30' },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-4">
                <div className={`p-2 rounded-xl ${s.bg} w-fit mb-2`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Shifts section */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Növbələr</h3>
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setShowShiftModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Növbə
                </button>
              </div>
            </div>

            {/* Monthly summary */}
            {shifts.length > 0 && (
              <div className="flex items-center gap-4 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm">
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">{formatNumber(totalHours)} saat</span>
                  <span className="text-blue-600/70">bu ay</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">{shifts.length}</span>
                  <span className="text-blue-600/70">növbə</span>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Tarix</th>
                    <th className="pb-2 font-medium">Növbə</th>
                    <th className="pb-2 font-medium">Başlama</th>
                    <th className="pb-2 font-medium">Bitmə</th>
                    <th className="pb-2 font-medium">Saatlar</th>
                    <th className="pb-2 font-medium">Qeyd</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((shift: any) => (
                    <tr key={shift.id} className="border-b border-border/50">
                      <td className="py-2">{formatDate(shift.date)}</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          shift.shiftType === 'MORNING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          shift.shiftType === 'EVENING' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                        }`}>
                          {shiftTypeLabels[shift.shiftType] ?? shift.shiftType}
                        </span>
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {shift.startTime ? new Date(shift.startTime).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {shift.endTime ? new Date(shift.endTime).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="py-2">
                        {shift.hoursWorked != null ? (
                          <span className="font-medium">{formatNumber(shift.hoursWorked)} s</span>
                        ) : '-'}
                      </td>
                      <td className="py-2 text-muted-foreground text-xs max-w-[120px] truncate">{shift.notes ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {shifts.length === 0 && (
                <p className="text-center text-muted-foreground py-6 text-sm">Bu ay üçün növbə yoxdur</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add shift modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Növbə Əlavə Et</h3>
              <button onClick={() => setShowShiftModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={addShift} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Tarix *</label>
                <input
                  required
                  type="date"
                  value={shiftForm.date}
                  onChange={(e) => setShiftForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Növbə növü *</label>
                <select
                  value={shiftForm.shiftType}
                  onChange={(e) => setShiftForm((p) => ({ ...p, shiftType: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MORNING">Səhər (06:00-14:00)</option>
                  <option value="EVENING">Axşam (14:00-22:00)</option>
                  <option value="NIGHT">Gecə (22:00-06:00)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Başlama *</label>
                  <input
                    required
                    type="time"
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm((p) => ({ ...p, startTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Bitmə</label>
                  <input
                    type="time"
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm((p) => ({ ...p, endTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Qeyd</label>
                <textarea
                  value={shiftForm.notes}
                  onChange={(e) => setShiftForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={savingShift}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium"
                >
                  {savingShift ? 'Əlavə edilir...' : 'Əlavə Et'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-accent"
                >
                  Ləğv
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
