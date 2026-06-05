'use client'
import useSWR from 'swr'
import Link from 'next/link'
import { useState } from 'react'
import { Plus, Users, UserCheck, ShieldAlert, User } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'

const fetcher = (u: string) => fetch(u).then((r) => r.json())

const ROLE_TABS = [
  { key: '', label: 'Hamısı' },
  { key: 'ADMIN', label: 'Admin' },
  { key: 'WORKER', label: 'İşçi' },
]

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
]

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function IsciPage() {
  const [roleFilter, setRoleFilter] = useState('')
  const { data: workers = [] } = useSWR(`/api/isciler${roleFilter ? `?role=${roleFilter}` : ''}`, fetcher)

  const total = workers.length
  const active = workers.filter((w: any) => w.isActive).length
  const adminCount = workers.filter((w: any) => w.role === 'ADMIN').length
  const workerCount = workers.filter((w: any) => w.role === 'WORKER').length

  return (
    <div>
      <PageHeader
        title="İşçilər"
        description="Əməkdaş idarəetməsi, növbələr və aktivlik statistikası"
        action={
          <Link
            href="/isci/yeni"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Yeni İşçi
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Cəmi', value: total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
          { label: 'Aktiv', value: active, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30' },
          { label: 'Admin', value: adminCount, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/30' },
          { label: 'İşçi', value: workerCount, icon: User, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-1 mb-6 bg-muted/40 rounded-xl p-1 w-fit">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRoleFilter(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              roleFilter === tab.key
                ? 'bg-white dark:bg-gray-800 shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Worker cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map((worker: any) => (
          <div
            key={worker.id}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold text-sm ${avatarColor(worker.name)}`}
                >
                  {getInitials(worker.name)}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{worker.name}</h3>
                  {worker.position && (
                    <p className="text-xs text-muted-foreground">{worker.position}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    worker.role === 'ADMIN'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}
                >
                  {worker.role === 'ADMIN' ? 'Admin' : 'İşçi'}
                </span>
                {worker.isActive ? (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Aktiv
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800">
                    Deaktiv
                  </span>
                )}
              </div>
            </div>

            {worker.phone && (
              <p className="text-sm text-muted-foreground mb-3">{worker.phone}</p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>{worker._count?.productionRuns ?? 0} run</span>
                <span>{worker._count?.printJobs ?? 0} çap</span>
              </div>
              <Link
                href={`/isci/${worker.id}`}
                className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors font-medium"
              >
                Ətraflı
              </Link>
            </div>
          </div>
        ))}
      </div>

      {workers.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>İşçi tapılmadı</p>
        </div>
      )}
    </div>
  )
}
