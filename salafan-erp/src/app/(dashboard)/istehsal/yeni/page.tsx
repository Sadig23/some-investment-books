'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { PageHeader } from '@/components/shared/PageHeader'
import { toast } from '@/hooks/use-toast'

const fetcher = (u: string) => fetch(u).then(r => r.json())

export default function YeniIstehsalPage() {
  const router = useRouter()
  const { data: products = [] } = useSWR('/api/mehsullar', fetcher)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    productId: '', plannedQty: '', unit: 'kg', priority: 'NORMAL',
    plannedStartDate: '', plannedEndDate: '', notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch('/api/istehsal/sifarisler', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plannedQty: parseFloat(form.plannedQty) }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'İstehsal sifarişi yaradıldı' })
      router.push('/istehsal')
    } catch { toast({ title: 'Xəta', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Yeni İstehsal Sifarişi" />
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Məhsul *</label>
          <select required value={form.productId} onChange={e => setForm(p => ({...p, productId: e.target.value}))}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Məhsul seçin</option>
            {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Planlaşdırılmış Miqdar *</label>
            <input required type="number" step="0.01" value={form.plannedQty} onChange={e => setForm(p => ({...p, plannedQty: e.target.value}))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Vahid</label>
            <input value={form.unit} onChange={e => setForm(p => ({...p, unit: e.target.value}))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Prioritet</label>
            <select value={form.priority} onChange={e => setForm(p => ({...p, priority: e.target.value}))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {['LOW','NORMAL','HIGH','URGENT'].map(v => <option key={v} value={v}>{['Aşağı','Normal','Yüksək','Təcili'][['LOW','NORMAL','HIGH','URGENT'].indexOf(v)]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Başlama Tarixi</label>
            <input type="date" value={form.plannedStartDate} onChange={e => setForm(p => ({...p, plannedStartDate: e.target.value}))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Qeyd</label>
          <textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} rows={2}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium">
            {loading ? 'Yaradılır...' : 'Yarat'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-border rounded-xl text-sm hover:bg-accent">Ləğv</button>
        </div>
      </form>
    </div>
  )
}
