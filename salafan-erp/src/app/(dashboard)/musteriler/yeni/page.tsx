'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { toast } from '@/hooks/use-toast'

interface FormState {
  name: string
  code: string
  contactName: string
  phone: string
  email: string
  address: string
  taxId: string
  notes: string
}

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function YeniMusterilerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>({
    name: '',
    code: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    taxId: '',
    notes: '',
  })

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/musteriler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          code: form.code || undefined,
          contactName: form.contactName || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
          taxId: form.taxId || undefined,
          notes: form.notes || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Xəta baş verdi')
      }

      toast({ title: 'Müştəri əlavə edildi' })
      router.push('/musteriler')
    } catch (err: unknown) {
      toast({
        title: err instanceof Error ? err.message : 'Xəta baş verdi',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/musteriler"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Geri
      </Link>

      <PageHeader title="Yeni Müştəri" description="Yeni müştəri əlavə edin" />

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-6 space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5">
              Ad <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={set('name')}
              placeholder="Müştəri adı"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Kod</label>
            <input
              value={form.code}
              onChange={set('code')}
              placeholder="Avtomatik yaradılacaq"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Əlaqə Şəxsi</label>
            <input
              value={form.contactName}
              onChange={set('contactName')}
              placeholder="Ad Soyad"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Telefon</label>
            <input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="+994 XX XXX XX XX"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="example@domain.com"
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5">Ünvan</label>
            <input
              value={form.address}
              onChange={set('address')}
              placeholder="Şəhər, küçə, ev nömrəsi"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">VÖEN</label>
            <input
              value={form.taxId}
              onChange={set('taxId')}
              placeholder="Vergi ödəyicisi eyniləşdirmə nömrəsi"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Qeydlər</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={3}
            placeholder="Əlavə qeydlər..."
            className={inputClass}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {loading ? 'Əlavə edilir...' : 'Müştəri Əlavə Et'}
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
