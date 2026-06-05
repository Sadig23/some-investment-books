'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { rawMaterialTypeLabels } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

export default function YeniXamalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', code: '', type: 'LDPE_GRANULE', unit: 'kg',
    currentStock: '0', minStockLevel: '100', unitCost: '0', supplier: '', description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/xamal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          currentStock: parseFloat(form.currentStock),
          minStockLevel: parseFloat(form.minStockLevel),
          unitCost: parseFloat(form.unitCost),
        }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Xamal əlavə edildi' })
      router.push('/xamal')
    } catch {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Yeni Xamal" description="Yeni xamal əlavə edin" />
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Ad *</label>
            <input required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Kod *</label>
            <input required value={form.code} onChange={e => setForm(p => ({...p, code: e.target.value}))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Növ *</label>
            <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {Object.entries(rawMaterialTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Ölçü Vahidi</label>
            <input value={form.unit} onChange={e => setForm(p => ({...p, unit: e.target.value}))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Başlanğıc Stok</label>
            <input type="number" step="0.01" value={form.currentStock} onChange={e => setForm(p => ({...p, currentStock: e.target.value}))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Minimum Stok</label>
            <input type="number" step="0.01" value={form.minStockLevel} onChange={e => setForm(p => ({...p, minStockLevel: e.target.value}))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Vahid Qiyməti (AZN)</label>
            <input type="number" step="0.01" value={form.unitCost} onChange={e => setForm(p => ({...p, unitCost: e.target.value}))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Təchizatçı</label>
            <input value={form.supplier} onChange={e => setForm(p => ({...p, supplier: e.target.value}))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Açıqlama</label>
          <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows={2}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors">
            {loading ? 'Əlavə edilir...' : 'Əlavə Et'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2.5 border border-border rounded-xl text-sm hover:bg-accent transition-colors">
            Ləğv Et
          </button>
        </div>
      </form>
    </div>
  )
}
