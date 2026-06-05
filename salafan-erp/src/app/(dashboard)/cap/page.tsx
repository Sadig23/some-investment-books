'use client'
import useSWR from 'swr'
import { useState } from 'react'
import { Plus, Printer } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const fetcher = (u: string) => fetch(u).then(r => r.json())

export default function CapPage() {
  const { data: jobs = [], mutate } = useSWR('/api/cap', fetcher)
  const { data: machines = [] } = useSWR('/api/aparatlar', fetcher)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ machineId: '', designName: '', colorCount: '1', notes: '' })
  const [loading, setLoading] = useState(false)

  const printers = machines.filter((m: any) => m.type === 'PRINTING' && m.status === 'ACTIVE')

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/cap/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      toast({ title: 'Status yeniləndi' }); mutate()
    } catch { toast({ title: 'Xəta', variant: 'destructive' }) }
  }

  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      await fetch('/api/cap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      toast({ title: 'Çap tapşırığı yaradıldı' }); setShowNew(false); mutate()
    } catch { toast({ title: 'Xəta', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <PageHeader
        title="Çap İşləri"
        description="Flexoqrafik çap tapşırıqları"
        action={
          <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
            <Plus className="w-4 h-4" /> Yeni Tapşırıq
          </button>
        }
      />

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>{['Tapşırıq №','Dizayn','Rəng sayı','Aparat','Operator','Tarix','Status',''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {jobs.map((j: any) => (
                <tr key={j.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{j.jobNumber}</td>
                  <td className="px-4 py-3 font-medium">{j.designName}</td>
                  <td className="px-4 py-3 text-center">{j.colorCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{j.machine?.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{j.operator?.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(j.createdAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                  <td className="px-4 py-3">
                    {j.status === 'PENDING' && (
                      <button onClick={() => updateStatus(j.id, 'IN_PROGRESS')} className="text-xs px-2 py-1 bg-blue-600 text-white rounded-lg">Başlat</button>
                    )}
                    {j.status === 'IN_PROGRESS' && (
                      <button onClick={() => updateStatus(j.id, 'COMPLETED')} className="text-xs px-2 py-1 bg-green-600 text-white rounded-lg">Tamamla</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Printer className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Çap tapşırığı yoxdur</p>
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold mb-4">Yeni Çap Tapşırığı</h3>
            <form onSubmit={submitNew} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Çap Aparatı *</label>
                <select required value={form.machineId} onChange={e => setForm(p => ({...p, machineId: e.target.value}))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="">Seçin</option>
                  {printers.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dizayn Adı *</label>
                <input required value={form.designName} onChange={e => setForm(p => ({...p, designName: e.target.value}))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rəng Sayı</label>
                <input type="number" min="1" max="8" value={form.colorCount} onChange={e => setForm(p => ({...p, colorCount: e.target.value}))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-60">
                  {loading ? 'Yaradılır...' : 'Yarat'}
                </button>
                <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2.5 border border-border rounded-xl text-sm">Ləğv</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
