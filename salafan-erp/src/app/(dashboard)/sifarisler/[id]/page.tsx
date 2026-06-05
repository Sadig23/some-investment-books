'use client'
import useSWR from 'swr'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Factory,
  FileText,
  Plus,
  Phone,
  MapPin,
  User,
  CreditCard,
  AlertTriangle,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatAZN, formatDate } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const fetcher = (u: string) => fetch(u).then((r) => r.json())

const inputClass =
  'px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Gözləmədə',
  IN_PROGRESS: 'İcrada',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'Ləğv edildi',
}

interface OrderItem {
  id: string
  productId: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  product: {
    id: string
    name: string
    code: string
    type: string
  }
}

interface ProductionOrderLink {
  id: string
  orderNumber: string
  status: string
  plannedQty: number
  unit: string
  product: { name: string }
}

interface Invoice {
  id: string
  invoiceNumber: string
  totalAmount: number
  paidAmount: number
  status: string
  dueDate: string | null
  createdAt: string
}

interface FullOrder {
  id: string
  orderNumber: string
  status: string
  orderDate: string
  dueDate: string | null
  deliveredDate: string | null
  totalAmount: number | null
  paidAmount: number
  notes: string | null
  customer: {
    id: string
    name: string
    code: string
    contactName: string | null
    phone: string | null
    address: string | null
  }
  items: OrderItem[]
  productionOrders: ProductionOrderLink[]
  invoices: Invoice[]
}

const productTypeLabels: Record<string, string> = {
  BAG: 'Torba',
  ROLL: 'Rulo',
  SHEET: 'Vərəq',
  OTHER: 'Digər',
}

export default function SifarisDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: order, mutate } = useSWR<FullOrder>(`/api/sifarisler/${id}`, fetcher)

  const [loading, setLoading] = useState(false)
  const [paidInput, setPaidInput] = useState('')
  const [confirmAction, setConfirmAction] = useState<
    null | 'confirm' | 'cancel' | 'complete' | 'invoice'
  >(null)

  if (!order) {
    return <div className="animate-pulse space-y-4">
      <div className="h-16 bg-muted rounded-2xl" />
      <div className="h-48 bg-muted rounded-2xl" />
      <div className="h-64 bg-muted rounded-2xl" />
    </div>
  }

  const debt = (order.totalAmount ?? 0) - order.paidAmount

  const doStatusChange = async (newStatus: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sifarisler/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      toast({
        title:
          newStatus === 'IN_PROGRESS'
            ? 'Sifariş təsdiqləndi'
            : newStatus === 'COMPLETED'
            ? 'Sifariş tamamlandı'
            : 'Sifariş ləğv edildi',
      })
      mutate()
    } catch {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' })
    } finally {
      setLoading(false)
      setConfirmAction(null)
    }
  }

  const doUpdatePayment = async () => {
    const amount = parseFloat(paidInput)
    if (isNaN(amount) || amount < 0) {
      toast({ title: 'Düzgün məbləğ daxil edin', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/sifarisler/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paidAmount: amount }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Ödəniş yeniləndi' })
      setPaidInput('')
      mutate()
    } catch {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const doCreateInvoice = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sifarisler/${id}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Faktura yaradıldı' })
      mutate()
    } catch {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' })
    } finally {
      setLoading(false)
      setConfirmAction(null)
    }
  }

  return (
    <div>
      <Link
        href="/sifarisler"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Geri
      </Link>

      <PageHeader
        title={order.orderNumber}
        description={`${order.customer.name} • ${formatDate(order.orderDate)}`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                statusColors[order.status] ?? 'bg-gray-100 text-gray-800'
              )}
            >
              {statusLabels[order.status] ?? order.status}
            </span>

            {order.status === 'PENDING' && (
              <>
                <button
                  onClick={() => setConfirmAction('confirm')}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
                >
                  <CheckCircle className="w-4 h-4" /> Təsdiqlə
                </button>
                <button
                  onClick={() => setConfirmAction('cancel')}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60"
                >
                  <XCircle className="w-4 h-4" /> Ləğv et
                </button>
              </>
            )}

            {order.status === 'IN_PROGRESS' && (
              <>
                <button
                  onClick={() => setConfirmAction('complete')}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
                >
                  <CheckCircle className="w-4 h-4" /> Tamamla
                </button>
                <Link
                  href="/istehsal/yeni"
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-xl text-sm hover:bg-accent transition-colors"
                >
                  <Factory className="w-4 h-4" /> İstehsal Sifarişi Yarat
                </Link>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order items */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold">Sifariş Maddələri</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Məhsul</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Növ</th>
                    <th className="text-right px-5 py-3 font-medium text-muted-foreground">Miqdar</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Vahid</th>
                    <th className="text-right px-5 py-3 font-medium text-muted-foreground">
                      Vahid Qiymət
                    </th>
                    <th className="text-right px-5 py-3 font-medium text-muted-foreground">Cəmi</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b border-border/50 last:border-0">
                      <td className="px-5 py-3">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">{item.product.code}</p>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">
                        {productTypeLabels[item.product.type] ?? item.product.type}
                      </td>
                      <td className="px-5 py-3 text-right">{item.quantity}</td>
                      <td className="px-5 py-3 text-muted-foreground">{item.unit}</td>
                      <td className="px-5 py-3 text-right">{formatAZN(item.unitPrice)}</td>
                      <td className="px-5 py-3 text-right font-medium">{formatAZN(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Production orders */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <Factory className="w-4 h-4 text-muted-foreground" />
                İstehsal Sifarişləri
              </h3>
            </div>
            {order.productionOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Bağlı istehsal sifarişi yoxdur
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">№</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Məhsul</th>
                      <th className="text-right px-5 py-3 font-medium text-muted-foreground">
                        Miqdar
                      </th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.productionOrders.map((po) => (
                      <tr key={po.id} className="border-b border-border/50 last:border-0">
                        <td className="px-5 py-3 font-mono text-xs">{po.orderNumber}</td>
                        <td className="px-5 py-3">{po.product.name}</td>
                        <td className="px-5 py-3 text-right">
                          {po.plannedQty} {po.unit}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={po.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Invoices */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Fakturalar
              </h3>
              <button
                onClick={() => setConfirmAction('invoice')}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-60"
              >
                <Plus className="w-4 h-4" /> Faktura Yarat
              </button>
            </div>
            {order.invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Faktura yoxdur
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Faktura №</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tarix</th>
                      <th className="text-right px-5 py-3 font-medium text-muted-foreground">Məbləğ</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-border/50 last:border-0">
                        <td className="px-5 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {formatDate(inv.createdAt)}
                        </td>
                        <td className="px-5 py-3 text-right font-medium">
                          {formatAZN(inv.totalAmount)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={inv.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Customer info */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
              Müştəri
            </h3>
            <div className="space-y-2">
              <p className="font-semibold">{order.customer.name}</p>
              <p className="text-xs text-muted-foreground">{order.customer.code}</p>
              {order.customer.contactName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span>{order.customer.contactName}</span>
                </div>
              )}
              {order.customer.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{order.customer.phone}</span>
                </div>
              )}
              {order.customer.address && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{order.customer.address}</span>
                </div>
              )}
              <div className="pt-2">
                <Link
                  href={`/musteriler/${order.customer.id}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Müştəri profilini aç →
                </Link>
              </div>
            </div>
          </div>

          {/* Financial summary */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Maliyyə
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sifarişin Dəyəri</span>
                <span className="font-semibold">
                  {order.totalAmount != null ? formatAZN(order.totalAmount) : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ödənilmiş</span>
                <span className="text-green-600 font-semibold">{formatAZN(order.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-3">
                <span className="text-muted-foreground font-medium">Qalıq Borc</span>
                <span
                  className={cn(
                    'font-bold',
                    debt > 0 ? 'text-red-600' : 'text-green-600'
                  )}
                >
                  {formatAZN(debt)}
                </span>
              </div>

              {debt > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Ödəniş gözlənilir</span>
                </div>
              )}

              {/* Payment input */}
              <div className="pt-3 border-t border-border space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Ödəniş qeyd et</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paidInput}
                    onChange={(e) => setPaidInput(e.target.value)}
                    placeholder="0.00 AZN"
                    className={cn(inputClass, 'flex-1')}
                  />
                  <button
                    type="button"
                    onClick={doUpdatePayment}
                    disabled={loading || !paidInput}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Yenilə
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Order details */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
              Sifariş Detalları
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sifariş Tarixi</span>
                <span>{formatDate(order.orderDate)}</span>
              </div>
              {order.dueDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Son Tarix</span>
                  <span>{formatDate(order.dueDate)}</span>
                </div>
              )}
              {order.deliveredDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Çatdırılma Tarixi</span>
                  <span>{formatDate(order.deliveredDate)}</span>
                </div>
              )}
              {order.notes && (
                <div className="pt-2 border-t border-border">
                  <p className="text-muted-foreground text-xs mb-1">Qeydlər</p>
                  <p>{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation modals */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            {confirmAction === 'confirm' && (
              <>
                <h3 className="font-semibold text-lg mb-2">Sifarişi Təsdiqlə</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Sifariş <strong>{order.orderNumber}</strong> icra statusuna keçiriləcək.
                  Davam etmək istəyirsiniz?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => doStatusChange('IN_PROGRESS')}
                    disabled={loading}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-60"
                  >
                    {loading ? 'Yenilənir...' : 'Təsdiqlə'}
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 py-2.5 border border-border rounded-xl text-sm"
                  >
                    Ləğv
                  </button>
                </div>
              </>
            )}

            {confirmAction === 'cancel' && (
              <>
                <h3 className="font-semibold text-lg mb-2">Sifarişi Ləğv Et</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Sifariş <strong>{order.orderNumber}</strong> ləğv ediləcək. Bu əməliyyat geri
                  alına bilməz.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => doStatusChange('CANCELLED')}
                    disabled={loading}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium disabled:opacity-60"
                  >
                    {loading ? 'Ləğv edilir...' : 'Bəli, Ləğv Et'}
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 py-2.5 border border-border rounded-xl text-sm"
                  >
                    Geri
                  </button>
                </div>
              </>
            )}

            {confirmAction === 'complete' && (
              <>
                <h3 className="font-semibold text-lg mb-2">Sifarişi Tamamla</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Sifariş <strong>{order.orderNumber}</strong> tamamlandı olaraq işarələnəcək.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => doStatusChange('COMPLETED')}
                    disabled={loading}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-60"
                  >
                    {loading ? 'Yenilənir...' : 'Tamamla'}
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 py-2.5 border border-border rounded-xl text-sm"
                  >
                    Ləğv
                  </button>
                </div>
              </>
            )}

            {confirmAction === 'invoice' && (
              <>
                <h3 className="font-semibold text-lg mb-2">Faktura Yarat</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Bu sifariş üçün{' '}
                  <strong>
                    {order.totalAmount != null ? formatAZN(order.totalAmount) : '0'} AZN
                  </strong>{' '}
                  məbləğli yeni faktura yaradılacaq.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={doCreateInvoice}
                    disabled={loading}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-60"
                  >
                    {loading ? 'Yaradılır...' : 'Fakturam Yarat'}
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 py-2.5 border border-border rounded-xl text-sm"
                  >
                    Ləğv
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
