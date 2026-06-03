'use client'
import useSWR from 'swr'
import Link from 'next/link'
import { useState } from 'react'
import { Plus, Search, AlertTriangle, Package } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatNumber, formatAZN, rawMaterialTypeLabels } from '@/lib/utils'

const fetcher = (u: string) => fetch(u).then(r => r.json())

export default function XamalPage() {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const { data: materials = [], mutate } = useSWR(`/api/xamal?search=${search}&type=${type}`, fetcher)

  return (
    <div>
      <PageHeader
        title="Xamal İdarəetməsi"
        description="Xamal stoku, alışlar və stok tənzimləmələri"
        action={
          <Link href="/xamal/yeni" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Yeni Xamal
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Xamal axtar..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Bütün növlər</option>
          {Object.entries(rawMaterialTypeLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <Link href="/xamal/alis" className="px-4 py-2 rounded-xl border border-border bg-background text-sm hover:bg-accent transition-colors">
          Alış Tarixçəsi
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map((mat: any) => {
          const isLow = mat.currentStock <= mat.minStockLevel
          const pct = Math.min(100, (mat.currentStock / Math.max(mat.minStockLevel * 2, 1)) * 100)
          return (
            <Link key={mat.id} href={`/xamal/${mat.id}`}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                {isLow && <AlertTriangle className="w-5 h-5 text-orange-500" />}
              </div>
              <h3 className="font-semibold group-hover:text-blue-600 transition-colors">{mat.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{mat.code} • {rawMaterialTypeLabels[mat.type] ?? mat.type}</p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className={isLow ? 'text-orange-600 font-medium' : 'text-foreground'}>
                    {formatNumber(mat.currentStock)} {mat.unit}
                  </span>
                  <span className="text-muted-foreground text-xs">Min: {formatNumber(mat.minStockLevel)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                  <div className={`h-1.5 rounded-full ${isLow ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <p className="mt-2 text-sm font-medium">{formatAZN(mat.unitCost)} / {mat.unit}</p>
            </Link>
          )
        })}
      </div>
      {materials.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Xamal tapılmadı</p>
        </div>
      )}
    </div>
  )
}
