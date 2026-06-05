'use client'
import useSWR from 'swr'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  FileText,
  Edit2,
  Trash2,
  Save,
  X,
  ShoppingBag,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatAZN, formatDate, formatNumber } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const fetcher = (u: string) => fetch(u).then((r) => r.json())

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

interface CustomerOrder {
  id: string
  orderNumber: string
  status: string
  orderDate: string
  dueDate: string | null
  totalAmount: number | null
  paidAmount: number
  _count: { items: number }
}

interface Customer {
  id: string
  name: string
  code: string
  contactName: string | null
  phone: string | null
  email: string | null
  address: string | null
  taxId: string | null
  notes: string | null
  createdAt: string
  orders: CustomerOrder[]
}

export default function MusterilerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: customer, mutate } = useSWR<Customer>(`/api/musteriler/${id}`, fetcher)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [form, setForm] = useState<Partial<Customer>>({})

  if (!customer) {
    return <div className="animate-pulse h-64 bg-muted rounded-2xl" />
  }

  const startEdit = () => {
    setForm({
      name: customer.name,
      code: customer.code,
      contactName: customer.contactName ?? '',
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      address: customer.address ?? '',
      taxId: customer.taxId ?? '',
      notes: customer.notes ?? '',
    })
    setEditing(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/musteriler/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Xəta baş verdi')
      }
      toast({ title: 'Müştəri yeniləndi' })
      mutate()
      setEditing(false)
    } catch (err: unknown) {
      toast({
        title: err instanceof Error ? err.message : 'Xəta baş verdi',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/musteriler/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Xəta baş verdi')
      }
      toast({ title: 'Müştəri silindi' })
      router.push('/musteriler')
    } catch (err: unknown) {
      toast({
        title: err instanceof Error ? err.message : 'Xəta baş verdi',
        variant: 'destructive',
      })
      setDeleteConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  const set =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }))

  return (
    <div>
      <Link
        href="/musteriler"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Geri
      </Link>

      <PageHeader
        title={customer.name}
        description={`${customer.code} • ${formatDate(customer.createdAt)} tarixindən`}
        action={
          <div className="flex gap-2">
            {!editing ? (
              <>
                <button
                  onClick={startEdit}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm hover:bg-accent transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> Redaktə
                </button>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Sil
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <Save className="w-4 h-4" /> {loading ? 'Saxlanır...' : 'Saxla'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm hover:bg-accent transition-colors"
                >
                  <X className="w-4 h-4" /> Ləğv
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5 space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Müştəri Məlumatları
            </h3>

            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">
                    Ad <span className="text-red-500">*</span>
                  </label>
                  <input required value={form.name ?? ''} onChange={set('name')} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Kod</label>
                  <input value={form.code ?? ''} onChange={set('code')} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Əlaqə Şəxsi</label>
                  <input value={(form.contactName as string) ?? ''} onChange={set('contactName')} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Telefon</label>
                  <input type="tel" value={(form.phone as string) ?? ''} onChange={set('phone')} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Email</label>
                  <input type="email" value={(form.email as string) ?? ''} onChange={set('email')} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Ünvan</label>
                  <input value={(form.address as string) ?? ''} onChange={set('address')} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">VÖEN</label>
                  <input value={(form.taxId as string) ?? ''} onChange={set('taxId')} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Qeydlər</label>
                  <textarea
                    value={(form.notes as string) ?? ''}
                    onChange={set('notes')}
                    rows={3}
                    className={inputClass}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {customer.contactName && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-6 flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </span>
                    <span>{customer.contactName}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-6 flex-shrink-0">
                      <Phone className="w-4 h-4" />
                    </span>
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-6 flex-shrink-0">
                      <Mail className="w-4 h-4" />
                    </span>
                    <span className="break-all">{customer.email}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground w-6 flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <span>{customer.address}</span>
                  </div>
                )}
                {customer.taxId && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">VÖEN</p>
                    <p className="text-sm font-mono mt-0.5">{customer.taxId}</p>
                  </div>
                )}
                {customer.notes && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Qeydlər</p>
                    <p className="text-sm text-muted-foreground">{customer.notes}</p>
                  </div>
                )}
                {!customer.contactName &&
                  !customer.phone &&
                  !customer.email &&
                  !customer.address &&
                  !customer.taxId &&
                  !customer.notes && (
                    <p className="text-sm text-muted-foreground italic">Əlavə məlumat yoxdur</p>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* Orders history */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                Sifariş Tarixçəsi
              </h3>
              <Link
                href={`/sifarisler/yeni`}
                className="text-xs text-blue-600 hover:underline"
              >
                + Yeni Sifariş
              </Link>
            </div>

            {customer.orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sifariş tapılmadı</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Sifariş №</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tarix</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Son Tarix</th>
                      <th className="text-right px-5 py-3 font-medium text-muted-foreground">Məbləğ</th>
                      <th className="text-right px-5 py-3 font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-border/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="px-5 py-3 font-mono font-medium">{order.orderNumber}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {formatDate(order.orderDate)}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {order.dueDate ? formatDate(order.dueDate) : '—'}
                        </td>
                        <td className="px-5 py-3 text-right font-medium">
                          {order.totalAmount != null ? formatAZN(order.totalAmount) : '—'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={`/sifarisler/${order.id}`}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            Ətraflı
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-lg mb-2">Müştərini Sil</h3>
            <p className="text-muted-foreground text-sm mb-6">
              <strong>{customer.name}</strong> müştərisini silmək istədiyinizə əminsiniz? Bu əməliyyat
              geri alına bilməz.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium"
              >
                {loading ? 'Silinir...' : 'Bəli, Sil'}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-2.5 border border-border rounded-xl text-sm hover:bg-accent"
              >
                Ləğv Et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
