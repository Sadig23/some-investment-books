'use client'
import useSWR from 'swr'
import Link from 'next/link'
import { useState } from 'react'
import { Plus, Factory, Play, CheckCircle2, Clock } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate, formatNumber, priorityLabels } from '@/lib/utils'

const fetcher = (u: string) => fetch(u).then(r => r.json())

const tabs = [
  { label: 'Bütün', value: '' },
  { label: 'Planlanmış', value: 'PLANNED' },
  { label: 'Davam Edir', value: 'IN_PROGRESS' },
  { label: 'Tamamlandı', value: 'COMPLETED' },
]

export default function IstehsalPage() {
  const [activeTab, setActiveTab] = useState('')
  const { data: orders = [] } = useSWR(`/api/istehsal/sifarisler?status=${activeTab}`, fetcher)
  const { data: runs = [] } = useSWR('/api/istehsal/run', fetcher)

  const inProgressCount = orders.filter((o: any) => o.status === 'IN_PROGRESS').length
  const todayRuns = runs.filter((r: any) => {
    if (!r.createdAt) return false
    const today = new Date().toDateString()
    return new Date(r.createdAt).toDateString() === today
  }).length

  return (
    <div>
      <PageHeader
        title="İstehsal"
        description="İstehsal sifarişləri, istehsal run-ları və film rulonları"
        action={
          <div className="flex gap-2">
            <Link href="/istehsal/yeni-run" className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium">
              <Play className="w-4 h-4" /> Yeni Run
            </Link>
            <Link href="/istehsal/yeni" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
              <Plus className="w-4 h-4" /> Yeni Sifariş
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Ümumi Sifariş', value: orders.length, icon: Factory, color: 'text-blue-600' },
          { label: 'Aktiv', value: inProgressCount, icon: Play, color: 'text-green-600' },
          { label: 'Bu gün run', value: todayRuns, icon: Clock, color: 'text-orange-600' },
          { label: 'Tamamlandı', value: orders.filter((o: any) => o.status === 'COMPLETED').length, icon: CheckCircle2, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-4">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-muted rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.value} onClick={() => setActiveTab(t.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === t.value ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Sifariş №', 'Məhsul', 'Planl. Miqdar', 'Prioritet', 'Status', 'Tarix', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => (
                <tr key={order.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{order.orderNumber}</td>
                  <td className="px-4 py-3 font-medium">{order.product?.name}</td>
                  <td className="px-4 py-3">{formatNumber(order.plannedQty)} {order.unit}</td>
                  <td className="px-4 py-3"><StatusBadge status={order.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/istehsal/${order.id}`} className="text-blue-600 hover:underline text-xs">Detay</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Factory className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Sifariş tapılmadı</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
