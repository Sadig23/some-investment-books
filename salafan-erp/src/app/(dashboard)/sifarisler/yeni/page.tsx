'use client'
import useSWR from 'swr'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatAZN } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const fetcher = (u: string) => fetch(u).then((r) => r.json())

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

interface Customer {
  id: string
  name: string
  code: string
}

interface Product {
  id: string
  name: string
  code: string
  unit: string
  type: string
}

interface OrderItem {
  productId: string
  quantity: string
  unit: string
  unitPrice: string
}

export default function YeniSifarisPage() {
  const router = useRouter()
  const { data: customers = [] } = useSWR<Customer[]>('/api/musteriler', fetcher)
  const { data: products = [] } = useSWR<Product[]>('/api/mehsullar?isActive=true', fetcher)

  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)

  // Step 1 state
  const [customerId, setCustomerId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  // Step 2 state
  const [items, setItems] = useState<OrderItem[]>([
    { productId: '', quantity: '', unit: '', unitPrice: '' },
  ])

  const addRow = () =>
    setItems((p) => [...p, { productId: '', quantity: '', unit: '', unitPrice: '' }])

  const removeRow = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i))

  const updateItem = (i: number, key: keyof OrderItem, value: string) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== i) return item
        const updated = { ...item, [key]: value }
        if (key === 'productId') {
          const prod = products.find((p) => p.id === value)
          if (prod) updated.unit = prod.unit
        }
        return updated
      })
    )
  }

  const rowTotal = (item: OrderItem) => {
    const q = parseFloat(item.quantity) || 0
    const p = parseFloat(item.unitPrice) || 0
    return q * p
  }

  const grandTotal = items.reduce((s, item) => s + rowTotal(item), 0)

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) {
      toast({ title: 'Müştəri seçin', variant: 'destructive' })
      return
    }
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validItems = items.filter(
      (it) => it.productId && parseFloat(it.quantity) > 0 && parseFloat(it.unitPrice) >= 0
    )

    if (validItems.length === 0) {
      toast({ title: 'Ən azı bir məhsul əlavə edin', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/sifarisler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          dueDate: dueDate || undefined,
          notes: notes || undefined,
          items: validItems.map((it) => ({
            productId: it.productId,
            quantity: parseFloat(it.quantity),
            unit: it.unit,
            unitPrice: parseFloat(it.unitPrice),
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Xəta baş verdi')
      }

      const order = await res.json()
      toast({ title: 'Sifariş yaradıldı' })
      router.push(`/sifarisler/${order.id}`)
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
    <div className="max-w-4xl">
      <Link
        href="/sifarisler"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Geri
      </Link>

      <PageHeader title="Yeni Sifariş" description="Müştəri sifarişi yaradın" />

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {([1, 2] as const).map((s) => (
          <div key={s} className="flex items-center gap-2">
            {s > 1 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
                step === s
                  ? 'bg-blue-600 text-white'
                  : step > s
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
              )}
            >
              <span>{s}</span>
              <span>{s === 1 ? 'Müştəri & Tarix' : 'Sifariş Maddələri'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <form
          onSubmit={handleStep1}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-6 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Müştəri <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className={inputClass}
            >
              <option value="">Müştəri seçin...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Son Tarix</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Qeydlər</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Sifariş haqqında əlavə məlumat..."
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Növbəti Addım →
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
      )}

      {/* Step 2 */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Sifariş Maddələri</h3>
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" /> Sətir Əlavə Et
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground min-w-[200px]">
                      Məhsul
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground w-28">
                      Miqdar
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground w-24">
                      Vahid
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground w-32">
                      Vahid Qiymət
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground w-32">
                      Cəmi
                    </th>
                    <th className="w-10 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-2">
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => updateItem(i, 'productId', e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Məhsul seçin...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.code})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          required
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                          placeholder="0"
                          className={inputClass}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          required
                          value={item.unit}
                          onChange={(e) => updateItem(i, 'unit', e.target.value)}
                          placeholder="ədəd"
                          className={inputClass}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          required
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
                          placeholder="0.00"
                          className={inputClass}
                        />
                      </td>
                      <td className="px-4 py-2 text-right font-medium">
                        {formatAZN(rowTotal(item))}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => removeRow(i)}
                          disabled={items.length === 1}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total row */}
            <div className="px-5 py-4 border-t border-border bg-gray-50 dark:bg-gray-800/50 flex justify-end">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Ümumi Məbləğ</p>
                <p className="text-xl font-bold mt-0.5">{formatAZN(grandTotal)}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-2.5 border border-border rounded-xl text-sm hover:bg-accent transition-colors"
            >
              ← Geri
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {loading ? 'Yaradılır...' : 'Sifariş Yarat'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
