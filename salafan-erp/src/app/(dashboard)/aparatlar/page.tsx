'use client'
import useSWR from 'swr'
import Link from 'next/link'
import { Plus, Cpu, Zap, Activity } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { machineTypeLabels, formatNumber } from '@/lib/utils'

const fetcher = (u: string) => fetch(u).then(r => r.json())

const statusColors: Record<string, string> = {
  ACTIVE: 'border-l-green-500',
  MAINTENANCE: 'border-l-orange-500',
  IDLE: 'border-l-gray-400',
  BROKEN: 'border-l-red-500',
}

export default function AparatlarPage() {
  const { data: machines = [] } = useSWR('/api/aparatlar', fetcher)

  return (
    <div>
      <PageHeader
        title="Aparatlar"
        description="Maşın parkı, güc göstəriciləri və texniki xidmət"
        action={
          <Link href="/aparatlar/yeni" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
            <Plus className="w-4 h-4" /> Yeni Aparat
          </Link>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {(['ACTIVE','MAINTENANCE','IDLE','BROKEN'] as const).map(s => {
          const count = machines.filter((m: any) => m.status === s).length
          const labels: Record<string, string> = { ACTIVE: 'Aktiv', MAINTENANCE: 'Texniki Xidmət', IDLE: 'Boş', BROKEN: 'Sıradan Çıxmış' }
          return (
            <div key={s} className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-4 text-center">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground mt-1">{labels[s]}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {machines.map((m: any) => (
          <Link key={m.id} href={`/aparatlar/${m.id}`}
            className={`bg-white dark:bg-gray-900 rounded-2xl border-l-4 border border-border p-5 hover:shadow-md transition-shadow group ${statusColors[m.status] ?? ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
                <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <StatusBadge status={m.status} />
            </div>
            <h3 className="font-semibold group-hover:text-blue-600 transition-colors">{m.name}</h3>
            <p className="text-xs text-muted-foreground">{m.code} • {machineTypeLabels[m.type] ?? m.type}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Zap className="w-3.5 h-3.5 text-yellow-500" />
                <span>{m.powerKw} kW</span>
              </div>
              {m.capacityKgHr && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Activity className="w-3.5 h-3.5 text-blue-500" />
                  <span>{m.capacityKgHr} kg/saat</span>
                </div>
              )}
            </div>
            {m.location && <p className="mt-2 text-xs text-muted-foreground">📍 {m.location}</p>}
          </Link>
        ))}
      </div>
      {machines.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Cpu className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aparat tapılmadı</p>
        </div>
      )}
    </div>
  )
}
