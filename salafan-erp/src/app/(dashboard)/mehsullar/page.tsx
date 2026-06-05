'use client'
import useSWR from 'swr'
import Link from 'next/link'
import { useState } from 'react'
import { Plus, Package } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatNumber } from '@/lib/utils'

const fetcher = (u: string) => fetch(u).then(r => r.json())

type ProductType = 'ALL' | 'FILM_ROLL' | 'BAG_PLAIN' | 'BAG_PRINTED'

const typeLabels: Record<ProductType, string> = {
  ALL: 'Hamısı',
  FILM_ROLL: 'Film Rulosu',
  BAG_PLAIN: 'Sadə Torba',
  BAG_PRINTED: 'Çaplı Torba',
}

const typeBadgeClasses: Record<string, string> = {
  FILM_ROLL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  BAG_PLAIN: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  BAG_PRINTED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

interface Product {
  id: string
  name: string
  code: string
  type: string
  unit: string
  widthMm: number | null
  lengthMm: number | null
  thicknessMicron: number | null
  weightGram: number | null
  colorSpec: string | null
  isActive: boolean
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="w-20 h-5 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
      <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-800 mb-3" />
      <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-gray-800 mb-1" />
      <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-gray-800 mb-4" />
      <div className="h-8 w-24 rounded-xl bg-gray-200 dark:bg-gray-700" />
    </div>
  )
}

export default function MehsullarPage() {
  const [activeType, setActiveType] = useState<ProductType>('ALL')
  const { data: products, isLoading } = useSWR<Product[]>(
    `/api/mehsullar?type=${activeType}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  const items = products ?? []

  return (
    <div>
      <PageHeader
        title="Məhsullar"
        description="Məhsul kataloqu — rulo, sadə və çaplı torbalar"
        action={
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium">
              {isLoading ? '...' : items.length}
            </span>
            <Link
              href="/mehsullar/yeni"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Yeni Məhsul
            </Link>
          </div>
        }
      />

      {/* Type filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(typeLabels) as ProductType[]).map(t => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors border ${
              activeType === t
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-background text-foreground border-border hover:bg-accent'
            }`}
          >
            {typeLabels[t]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Məhsul tapılmadı</p>
          <p className="text-sm mt-1 opacity-70">Bu kateqoriyada məhsul mövcud deyil</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(product => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5 hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Header row */}
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeBadgeClasses[product.type] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                  {typeLabels[product.type as ProductType] ?? product.type}
                </span>
              </div>

              {/* Name & code */}
              <h3 className="font-semibold text-foreground leading-snug">{product.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">{product.code}</p>

              {/* Dimensions */}
              {(product.widthMm || product.lengthMm || product.thicknessMicron) && (
                <p className="text-xs text-muted-foreground mb-1">
                  {product.widthMm && product.lengthMm
                    ? `${formatNumber(product.widthMm, 0)} × ${formatNumber(product.lengthMm, 0)} mm`
                    : product.widthMm
                    ? `En: ${formatNumber(product.widthMm, 0)} mm`
                    : null}
                  {product.thicknessMicron ? ` · ${formatNumber(product.thicknessMicron, 0)} µm` : ''}
                </p>
              )}

              {/* Weight */}
              {product.weightGram && (
                <p className="text-xs text-muted-foreground mb-2">
                  {formatNumber(product.weightGram, 1)} q / vahid
                </p>
              )}

              {/* Unit badge */}
              <span className="self-start mt-auto mb-3 text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-muted-foreground font-medium">
                {product.unit}
              </span>

              {/* CTA */}
              <Link
                href={`/mehsullar/${product.id}`}
                className="mt-auto inline-flex items-center justify-center px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors"
              >
                Ətraflı
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
