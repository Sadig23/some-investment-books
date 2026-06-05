'use client'
import useSWR from 'swr'
import Link from 'next/link'
import { useState } from 'react'
import { Plus, ShoppingBag } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatAZN, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const fetcher = (u: string) => fetch(u).then((r) => r.json())

type OrderStatus = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

interface OrderRow {
  id: string
  orderNumber: string
  status: string
  orderDate: string
  dueDate: string | null
  totalAmount: number | null
  paidAmount: number
  customer: { id: string; name: string }
  _count: { items: number }
}

const tabs: { key: OrderStatus; label: string }[] = [
  { key: 'ALL', label: 'Hamısı' },
  { key: 'PENDING', label: 'Gözləmədə' },
  { key: 'IN_PROGRESS', label: 'İcrada' },
  { key: 'COMPLETED', label: 'Tamamlandı' },
  { key: 'CANCELLED', label: 'Ləğv edildi' },
]

const statusBadgeColors: Record<string, string> = {
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

export default function SifarislerPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus>('ALL')

  const url = activeTab === 'ALL' ? '/api/sifarisler' : `/api/sifarisler?status=${activeTab}`
  const { data: orders = [] } = useSWR<OrderRow[]>(url, fetcher)

  const totalOrders = orders.length
  const outstanding = orders
    .filter((o) => o.status !== 'CANCELLED' && o.status !== 'COMPLETED')
    .reduce((s, o) => s + ((o.totalAmount ?? 0) - o.paidAmount), 0)

  return (
    <div>
      <PageHeader
        title="Sifarişlər"
        description="Müştəri sifarişlərini idarə edin"
        action={
          <Link
            href="/sifarisler/yeni"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Yeni Sifariş
          </Link>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Cəmi Sifariş</p>
          <p className="text-2xl font-bold mt-1">{totalOrders}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Aktiv Qalıq Borc</p>
          <p
            className={cn(
              'text-2xl font-bold mt-1',
              outstanding > 0 ? 'text-red-600' : 'text-green-600'
            )}
          >
            {formatAZN(outstanding)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-900 shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white dark:bg-gray-900 rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Sifariş №</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Müştəri</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Sifariş Tarixi</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Son Tarix</th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground">Məbləğ</th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground">Ödənilmiş</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground">Əməliyyatlar</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                className="border-b border-border/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                onClick={() => (window.location.href = `/sifarisler/${o.id}`)}
              >
                <td className="px-5 py-3 font-mono font-medium">{o.orderNumber}</td>
                <td className="px-5 py-3">{o.customer.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{formatDate(o.orderDate)}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  {o.dueDate ? formatDate(o.dueDate) : '—'}
                </td>
                <td className="px-5 py-3 text-right font-medium">
                  {o.totalAmount != null ? formatAZN(o.totalAmount) : '—'}
                </td>
                <td className="px-5 py-3 text-right text-muted-foreground">
                  {formatAZN(o.paidAmount)}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      statusBadgeColors[o.status] ?? 'bg-gray-100 text-gray-800'
                    )}
                  >
                    {statusLabels[o.status] ?? o.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/sifarisler/${o.id}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-accent transition-colors"
                  >
                    Ətraflı
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sifariş tapılmadı</p>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/sifarisler/${o.id}`}
            className="block bg-white dark:bg-gray-900 rounded-2xl border border-border p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-mono font-semibold text-sm">{o.orderNumber}</p>
                <p className="text-muted-foreground text-sm mt-0.5">{o.customer.name}</p>
              </div>
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  statusBadgeColors[o.status] ?? 'bg-gray-100 text-gray-800'
                )}
              >
                {statusLabels[o.status] ?? o.status}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-3">
              <span className="text-muted-foreground">{formatDate(o.orderDate)}</span>
              <div className="text-right">
                <p className="font-medium">{o.totalAmount != null ? formatAZN(o.totalAmount) : '—'}</p>
                <p className="text-xs text-muted-foreground">Ödənilmiş: {formatAZN(o.paidAmount)}</p>
              </div>
            </div>
          </Link>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sifariş tapılmadı</p>
          </div>
        )}
      </div>
    </div>
  )
}
