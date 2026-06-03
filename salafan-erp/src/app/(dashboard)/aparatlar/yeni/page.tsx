'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { machineTypeLabels } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

export default function YeniAparatPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', code: '', type: 'EXTRUSION', powerKw: '', capacityKgHr: '',
    manufacturer: '', model: '', location: '', description: '', status: 'ACTIVE',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch('/api/aparatlar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, powerKw: parseFloat(form.powerKw), capacityKgHr: form.capacityKgHr ? parseFloat(form.capacityKgHr) : null }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Aparat əlavə edildi' })
      router.push('/aparatlar')
    } catch { toast({ title: 'Xəta baş verdi', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Yeni Aparat" />
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Ad', key: 'name', required: true }, { label: 'Kod', key: 'code', required: true },
            { label: 'Güc (kW)', key: 'powerKw', type: 'number' }, { label: 'Məhsuldarlıq (kg/saat)', key: 'capacityKgHr', type: 'number' },
            { label: 'İstehsalçı', key: 'manufacturer' }, { label: 'Model', key: 'model' },
            { label: 'Yer', key: 'location' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1.5">{f.label}{f.required ? ' *' : ''}</label>
              <input required={!!f.required} type={f.type ?? 'text'} step="0.01"
                value={(form as any)[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-1.5">Növ</label>
            <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {Object.entries(machineTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Açıqlama</label>
          <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows={2}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium">
            {loading ? 'Əlavə edilir...' : 'Əlavə Et'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-border rounded-xl text-sm hover:bg-accent">Ləğv</button>
        </div>
      </form>
    </div>
  )
}
