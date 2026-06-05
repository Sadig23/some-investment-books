'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { toast } from '@/hooks/use-toast'

type ProductType = 'FILM_ROLL' | 'BAG_PLAIN' | 'BAG_PRINTED'

const typeOptions: { value: ProductType; label: string }[] = [
  { value: 'FILM_ROLL', label: 'Film Rulosu' },
  { value: 'BAG_PLAIN', label: 'Sadə Torba' },
  { value: 'BAG_PRINTED', label: 'Çaplı Torba' },
]

interface FormState {
  name: string
  code: string
  type: ProductType
  unit: string
  widthMm: string
  lengthMm: string
  thicknessMicron: string
  weightGram: string
  colorSpec: string
  description: string
}

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const labelClass = 'block text-sm font-medium mb-1.5'

export default function YeniMehsulPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>({
    name: '',
    code: '',
    type: 'BAG_PLAIN',
    unit: 'ədəd',
    widthMm: '',
    lengthMm: '',
    thicknessMicron: '',
    weightGram: '',
    colorSpec: '',
    description: '',
  })

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        code: form.code,
        type: form.type,
        unit: form.unit,
        widthMm: form.widthMm ? parseFloat(form.widthMm) : undefined,
        lengthMm: form.lengthMm ? parseFloat(form.lengthMm) : undefined,
        thicknessMicron: form.thicknessMicron ? parseFloat(form.thicknessMicron) : undefined,
        description: form.description || undefined,
      }
      if (form.type !== 'FILM_ROLL' && form.weightGram) {
        payload.weightGram = parseFloat(form.weightGram)
      }
      if (form.type === 'BAG_PRINTED' && form.colorSpec) {
        payload.colorSpec = form.colorSpec
      }

      const res = await fetch('/api/mehsullar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Xəta')
      }
      toast({ title: 'Məhsul əlavə edildi' })
      router.push('/mehsullar')
    } catch (err: unknown) {
      toast({
        title: 'Xəta baş verdi',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <Link
          href="/mehsullar"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Məhsullara qayıt
        </Link>
      </div>

      <PageHeader title="Yeni Məhsul" description="Yeni məhsul əlavə edin" />

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Məhsul adı */}
          <div className="sm:col-span-2">
            <label className={labelClass}>Məhsul adı *</label>
            <input
              required
              value={form.name}
              onChange={set('name')}
              className={inputClass}
              placeholder="Məs. LDPE Torba 30×40"
            />
          </div>

          {/* Kod */}
          <div>
            <label className={labelClass}>Kod</label>
            <input
              value={form.code}
              onChange={set('code')}
              className={inputClass}
              placeholder="Avtomatik yaradılacaq"
            />
          </div>

          {/* Növ */}
          <div>
            <label className={labelClass}>Növ *</label>
            <select required value={form.type} onChange={set('type')} className={inputClass}>
              {typeOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Vahid */}
          <div>
            <label className={labelClass}>Vahid *</label>
            <input
              required
              value={form.unit}
              onChange={set('unit')}
              className={inputClass}
              placeholder="ədəd"
            />
          </div>

          {/* En */}
          <div>
            <label className={labelClass}>En (mm)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.widthMm}
              onChange={set('widthMm')}
              className={inputClass}
              placeholder="300"
            />
          </div>

          {/* Boy */}
          <div>
            <label className={labelClass}>Boy (mm)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.lengthMm}
              onChange={set('lengthMm')}
              className={inputClass}
              placeholder="400"
            />
          </div>

          {/* Qalınlıq */}
          <div>
            <label className={labelClass}>Qalınlıq (µm)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.thicknessMicron}
              onChange={set('thicknessMicron')}
              className={inputClass}
              placeholder="40"
            />
          </div>

          {/* Çəki — only for non-FILM_ROLL */}
          {form.type !== 'FILM_ROLL' && (
            <div>
              <label className={labelClass}>Çəki (q)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.weightGram}
                onChange={set('weightGram')}
                className={inputClass}
                placeholder="12.5"
              />
            </div>
          )}

          {/* Rəng spesifikasiyası — only for BAG_PRINTED */}
          {form.type === 'BAG_PRINTED' && (
            <div className="sm:col-span-2">
              <label className={labelClass}>Rəng spesifikasiyası</label>
              <input
                value={form.colorSpec}
                onChange={set('colorSpec')}
                className={inputClass}
                placeholder="Məs. 4 rəng, CMYK"
              />
            </div>
          )}
        </div>

        {/* Açıqlama */}
        <div>
          <label className={labelClass}>Açıqlama</label>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={3}
            className={inputClass}
            placeholder="Əlavə məlumat..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {loading ? 'Əlavə edilir...' : 'Əlavə Et'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-border rounded-xl text-sm hover:bg-accent transition-colors"
          >
            Ləğv Et
          </button>
        </div>
      </form>
    </div>
  )
}
