'use client'
import useSWR from 'swr'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Play, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate, formatNumber } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const fetcher = (u: string) => fetch(u).then(r => r.json())

export default function IstehsalDetailPage() {
  const { id } = useParams()
  const { data: order, mutate } = useSWR(`/api/istehsal/sifarisler/${id}`, fetcher)
  const [showComplete, setShowComplete] = useState<string | null>(null)
  const [completeForm, setCompleteForm] = useState({ actualQtyKg: '', wasteKg: '', qualityGrade: 'A' })
  const [loading, setLoading] = useState(false)

  if (!order) return <div className="animate-pulse h-64 bg-muted rounded-2xl" />

  const completeRun = async (runId: string, newStatus: string) => {
    setLoading(true)
    try {
      await fetch(`/api/istehsal/run/${runId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...completeForm }),
      })
      toast({ title: newStatus === 'COMPLETED' ? 'Run tamamlandı' : 'Status yeniləndi' })
      setShowComplete(null); mutate()
    } catch { toast({ title: 'Xəta', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <Link href="/istehsal" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Geri
      </Link>
      <PageHeader
        title={order.orderNumber}
        description={`Məhsul: ${order.product?.name}`}
        action={<StatusBadge status={order.status} />}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Planlaşdırılmış', value: `${formatNumber(order.plannedQty)} ${order.unit}` },
          { label: 'Prioritet', value: <StatusBadge status={order.priority} /> },
          { label: 'Status', value: <StatusBadge status={order.status} /> },
          { label: 'Tarix', value: formatDate(order.createdAt) },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <div className="font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5">
        <h3 className="font-semibold mb-4">İstehsal Run-ları</h3>
        <div className="space-y-3">
          {(order.productionRuns ?? []).map((run: any) => (
            <div key={run.id} className="border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-mono text-xs text-muted-foreground">{run.runNumber}</span>
                  <p className="font-medium">{run.machine?.name} • {run.operator?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={run.status} />
                  {run.status === 'PENDING' && (
                    <button onClick={() => completeRun(run.id, 'IN_PROGRESS')}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs">
                      <Play className="w-3 h-3" /> Başlat
                    </button>
                  )}
                  {run.status === 'IN_PROGRESS' && (
                    <button onClick={() => setShowComplete(run.id)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg text-xs">
                      <CheckCircle2 className="w-3 h-3" /> Tamamla
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                <span>Plan: {formatNumber(run.plannedQtyKg)} kg</span>
                {run.actualQtyKg && <span>Faktiki: {formatNumber(run.actualQtyKg)} kg</span>}
                {run.wasteKg > 0 && <span>Tullantı: {formatNumber(run.wasteKg)} kg</span>}
              </div>
            </div>
          ))}
          {!order.productionRuns?.length && (
            <p className="text-center text-muted-foreground py-6 text-sm">Run yoxdur. <Link href="/istehsal/yeni-run" className="text-blue-600 hover:underline">Yeni run yarat</Link></p>
          )}
        </div>
      </div>

      {showComplete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold mb-4">Run-ı Tamamla</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Faktiki Miqdar (kg)</label>
                <input type="number" step="0.01" value={completeForm.actualQtyKg} onChange={e => setCompleteForm(p => ({...p, actualQtyKg: e.target.value}))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tullantı (kg)</label>
                <input type="number" step="0.01" value={completeForm.wasteKg} onChange={e => setCompleteForm(p => ({...p, wasteKg: e.target.value}))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Keyfiyyət Dərəcəsi</label>
                <select value={completeForm.qualityGrade} onChange={e => setCompleteForm(p => ({...p, qualityGrade: e.target.value}))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="A">A - Premium</option><option value="B">B - Standart</option><option value="C">C - Qüsurlu</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => completeRun(showComplete, 'COMPLETED')} disabled={loading}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-60">
                  {loading ? 'Saxlanır...' : 'Tamamla'}
                </button>
                <button onClick={() => setShowComplete(null)} className="px-4 py-2.5 border border-border rounded-xl text-sm">Ləğv</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
