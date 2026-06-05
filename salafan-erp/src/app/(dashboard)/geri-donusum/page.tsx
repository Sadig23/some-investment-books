'use client'
import useSWR from 'swr'
import Link from 'next/link'
import { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate, formatNumber, recyclingInputLabels } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const fetcher = (u: string) => fetch(u).then(r => r.json())

export default function GeriDonusumPage() {
  const { data: batches = [], mutate } = useSWR('/api/geri-donusum', fetcher)
  const [showNew, setShowNew] = useState(false)
  const { data: machines = [] } = useSWR('/api/aparatlar', fetcher)
  const { data: materials = [] } = useSWR('/api/xamal', fetcher)
  const [form, setForm] = useState({ machineId: '', inputType: 'PRODUCTION_WASTE', inputWeightKg: '', outputMaterialId: '', notes: '' })
  const [loading, setLoading] = useState(false)

  const recyclingMachines = machines.filter((m: any) => m.type === 'RECYCLING' && m.status === 'ACTIVE')
  const recycledMaterials = materials.filter((m: any) => m.type === 'RECYCLED_GRANULE')

  const updateStatus = async (id: string, status: string, outputWeightKg?: string) => {
    try {
      await fetch(`/api/geri-donusum/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, outputWeightKg }),
      })
      toast({ title: 'Status yeniləndi' }); mutate()
    } catch { toast({ title: 'Xəta', variant: 'destructive' }) }
  }

  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      await fetch('/api/geri-donusum', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      toast({ title: 'Geri dönüşüm partiyası yaradıldı' })
      setShowNew(false); mutate()
    } catch { toast({ title: 'Xəta', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  const totalInput = batches.reduce((s: number, b: any) => s + b.inputWeightKg, 0)
  const totalOutput = batches.filter((b: any) => b.outputWeightKg).reduce((s: number, b: any) => s + b.outputWeightKg, 0)
  const avgEfficiency = totalInput > 0 ? Math.round((totalOutput / totalInput) * 100) : 0

  return (
    <div>
      <PageHeader
        title="Geri Dönüşüm"
        description="Tullantıların geri emalı prosesi"
        action={
          <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
            <Plus className="w-4 h-4" /> Yeni Partiya
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold">{formatNumber(totalInput)} kg</p><p className="text-xs text-muted-foreground">Ümumi Giriş</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold">{formatNumber(totalOutput)} kg</p><p className="text-xs text-muted-foreground">Ümumi Çıxış</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{avgEfficiency}%</p><p className="text-xs text-muted-foreground">Effektivlik</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>{['Partiya №','Növ','Giriş (kg)','Çıxış (kg)','Effektivlik','Aparat','Operator','Status',''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {batches.map((b: any) => (
                <tr key={b.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{b.batchNumber}</td>
                  <td className="px-4 py-3">{recyclingInputLabels[b.inputType] ?? b.inputType}</td>
                  <td className="px-4 py-3">{formatNumber(b.inputWeightKg)}</td>
                  <td className="px-4 py-3">{b.outputWeightKg ? formatNumber(b.outputWeightKg) : '—'}</td>
                  <td className="px-4 py-3">{b.efficiency ? `${Math.round(b.efficiency)}%` : '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.machine?.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.operator?.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3">
                    {b.status === 'PENDING' && (
                      <button onClick={() => updateStatus(b.id, 'IN_PROGRESS')} className="text-xs px-2 py-1 bg-blue-600 text-white rounded-lg">Başlat</button>
                    )}
                    {b.status === 'IN_PROGRESS' && (
                      <button onClick={() => {
                        const kg = prompt('Çıxış miqdarı (kg):')
                        if (kg) updateStatus(b.id, 'COMPLETED', kg)
                      }} className="text-xs px-2 py-1 bg-green-600 text-white rounded-lg">Tamamla</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {batches.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <RefreshCw className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Geri dönüşüm partiyası yoxdur</p>
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold mb-4">Yeni Geri Dönüşüm Partiyası</h3>
            <form onSubmit={submitNew} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Aparat *</label>
                <select required value={form.machineId} onChange={e => setForm(p => ({...p, machineId: e.target.value}))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="">Seçin</option>
                  {recyclingMachines.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Giriş Növü</label>
                <select value={form.inputType} onChange={e => setForm(p => ({...p, inputType: e.target.value}))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  {Object.entries(recyclingInputLabels).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Giriş Miqdarı (kg) *</label>
                <input required type="number" step="0.01" value={form.inputWeightKg} onChange={e => setForm(p => ({...p, inputWeightKg: e.target.value}))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Çıxış Materialı</label>
                <select value={form.outputMaterialId} onChange={e => setForm(p => ({...p, outputMaterialId: e.target.value}))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="">Seçin (istəyə bağlı)</option>
                  {recycledMaterials.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
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
