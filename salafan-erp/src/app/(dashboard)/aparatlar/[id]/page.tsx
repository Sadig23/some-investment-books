'use client'
import useSWR from 'swr'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Zap, Activity, Wrench } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { machineTypeLabels, formatDate, formatNumber } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const fetcher = (u: string) => fetch(u).then(r => r.json())

export default function AparatDetailPage() {
  const { id } = useParams()
  const { data: m, mutate } = useSWR(`/api/aparatlar/${id}`, fetcher)
  const [showMaint, setShowMaint] = useState(false)
  const [mForm, setMForm] = useState({ type: 'PREVENTIVE', description: '', performedBy: '', cost: '', downtimeHours: '', status: 'COMPLETED' })
  const [loading, setLoading] = useState(false)

  if (!m) return <div className="animate-pulse h-64 bg-muted rounded-2xl" />

  const submitMaint = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      await fetch(`/api/aparatlar/${id}/texniki`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...mForm, cost: mForm.cost ? parseFloat(mForm.cost) : null, downtimeHours: mForm.downtimeHours ? parseFloat(mForm.downtimeHours) : null }),
      })
      toast({ title: 'Texniki xidmət qeyd edildi' })
      setShowMaint(false); mutate()
    } catch { toast({ title: 'Xəta', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <Link href="/aparatlar" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Geri
      </Link>
      <PageHeader
        title={m.name}
        description={`${m.code} • ${machineTypeLabels[m.type] ?? m.type}`}
        action={
          <div className="flex gap-2">
            <StatusBadge status={m.status} />
            <button onClick={() => setShowMaint(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm hover:bg-accent">
              <Wrench className="w-4 h-4" /> Texniki Xidmət
            </button>
          </div>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 text-yellow-600 mb-1"><Zap className="w-4 h-4" /><span className="text-xs">Güc</span></div>
          <p className="text-2xl font-bold">{m.powerKw} kW</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1"><Activity className="w-4 h-4" /><span className="text-xs">Məhsuldarlıq</span></div>
          <p className="text-2xl font-bold">{m.capacityKgHr ?? '—'} <span className="text-sm font-normal text-muted-foreground">kg/saat</span></p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">İstehsalçı</p>
          <p className="font-semibold">{m.manufacturer ?? '—'}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Yer</p>
          <p className="font-semibold">{m.location ?? '—'}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5">
        <h3 className="font-semibold mb-4">Texniki Xidmət Tarixçəsi</h3>
        <div className="space-y-3">
          {(m.maintenanceLogs ?? []).map((log: any) => (
            <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
              <Wrench className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{log.description}</p>
                  <StatusBadge status={log.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {log.performedBy} • {formatDate(log.createdAt)}
                  {log.cost && ` • ${formatNumber(log.cost)} AZN`}
                  {log.downtimeHours && ` • ${log.downtimeHours} saat`}
                </p>
              </div>
            </div>
          ))}
          {!m.maintenanceLogs?.length && <p className="text-center text-muted-foreground py-4 text-sm">Texniki xidmət qeydi yoxdur</p>}
        </div>
      </div>

      {showMaint && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold mb-4">Texniki Xidmət Əlavə Et</h3>
            <form onSubmit={submitMaint} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Növ</label>
                <select value={mForm.type} onChange={e => setMForm(p => ({...p, type: e.target.value}))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="PREVENTIVE">Profilaktik</option><option value="CORRECTIVE">Düzəldici</option>
                  <option value="EMERGENCY">Təcili</option><option value="CALIBRATION">Kalibrovka</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Açıqlama *</label>
                <textarea required value={mForm.description} onChange={e => setMForm(p => ({...p, description: e.target.value}))} rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Texniki *</label>
                  <input required value={mForm.performedBy} onChange={e => setMForm(p => ({...p, performedBy: e.target.value}))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Xərc (AZN)</label>
                  <input type="number" step="0.01" value={mForm.cost} onChange={e => setMForm(p => ({...p, cost: e.target.value}))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select value={mForm.status} onChange={e => setMForm(p => ({...p, status: e.target.value}))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="COMPLETED">Tamamlandı</option><option value="IN_PROGRESS">Davam Edir</option><option value="SCHEDULED">Planlanmış</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-60">
                  {loading ? 'Saxlanır...' : 'Qeyd Et'}
                </button>
                <button type="button" onClick={() => setShowMaint(false)} className="px-4 py-2.5 border border-border rounded-xl text-sm">Ləğv</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
