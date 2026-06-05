'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { PageHeader } from '@/components/shared/PageHeader'
import { toast } from '@/hooks/use-toast'
import { Plus, Trash2 } from 'lucide-react'

const fetcher = (u: string) => fetch(u).then(r => r.json())

export default function YeniRunPage() {
  const router = useRouter()
  const { data: orders = [] } = useSWR('/api/istehsal/sifarisler?status=PLANNED', fetcher)
  const { data: machines = [] } = useSWR('/api/aparatlar', fetcher)
  const { data: materials = [] } = useSWR('/api/xamal', fetcher)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ productionOrderId: '', machineId: '', plannedQtyKg: '', filmWidthMm: '', filmThicknessMicron: '' })
  const [rawMaterials, setRawMaterials] = useState<{ rawMaterialId: string; qty: string }[]>([])

  const addMaterial = () => setRawMaterials(p => [...p, { rawMaterialId: '', qty: '' }])
  const removeMaterial = (i: number) => setRawMaterials(p => p.filter((_, idx) => idx !== i))
  const updateMaterial = (i: number, key: string, val: string) =>
    setRawMaterials(p => p.map((m, idx) => idx === i ? { ...m, [key]: val } : m))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch('/api/istehsal/run', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rawMaterials }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'İstehsal run-ı yaradıldı' })
      router.push('/istehsal')
    } catch { toast({ title: 'Xəta', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  const extMachines = machines.filter((m: any) => m.type === 'EXTRUSION' && m.status === 'ACTIVE')

  return (
    <div className="max-w-2xl">
      <PageHeader title="Yeni İstehsal Run" description="Ekstruziya prosesini başladın" />
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">İstehsal Sifarişi *</label>
          <select required value={form.productionOrderId} onChange={e => setForm(p => ({...p, productionOrderId: e.target.value}))}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Sifariş seçin</option>
            {orders.map((o: any) => <option key={o.id} value={o.id}>{o.orderNumber} — {o.product?.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Aparat *</label>
            <select required value={form.machineId} onChange={e => setForm(p => ({...p, machineId: e.target.value}))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Aparat seçin</option>
              {extMachines.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Planlaşdırılmış (kg) *</label>
            <input required type="number" step="0.01" value={form.plannedQtyKg} onChange={e => setForm(p => ({...p, plannedQtyKg: e.target.value}))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Film Eni (mm)</label>
            <input type="number" value={form.filmWidthMm} onChange={e => setForm(p => ({...p, filmWidthMm: e.target.value}))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Qalınlıq (mkm)</label>
            <input type="number" value={form.filmThicknessMicron} onChange={e => setForm(p => ({...p, filmThicknessMicron: e.target.value}))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Raw materials */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Xamal İstifadəsi</label>
            <button type="button" onClick={addMaterial} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
              <Plus className="w-3.5 h-3.5" /> Əlavə Et
            </button>
          </div>
          <div className="space-y-2">
            {rawMaterials.map((rm, i) => (
              <div key={i} className="flex gap-2">
                <select value={rm.rawMaterialId} onChange={e => updateMaterial(i, 'rawMaterialId', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Xamal seçin</option>
                  {materials.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.currentStock} {m.unit})</option>)}
                </select>
                <input type="number" step="0.01" placeholder="kg" value={rm.qty} onChange={e => updateMaterial(i, 'qty', e.target.value)}
                  className="w-24 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => removeMaterial(i)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium">
            {loading ? 'Başladılır...' : 'Run-ı Başlat'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-border rounded-xl text-sm hover:bg-accent">Ləğv</button>
        </div>
      </form>
    </div>
  )
}
