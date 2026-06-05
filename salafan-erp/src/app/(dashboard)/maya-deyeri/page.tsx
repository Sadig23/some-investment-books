'use client'
import useSWR from 'swr'
import { useState } from 'react'
import {
  Calculator,
  History,
  Layers,
  Zap,
  Users,
  Settings2,
  Trash2,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatAZN, formatNumber, formatDate } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const fetcher = (u: string) => fetch(u).then(r => r.json())

interface Product {
  id: string
  name: string
  code: string
  type: string
  weightGram: number | null
}

interface Recipe {
  id: string
  name: string
  isDefault: boolean
}

interface CostResult {
  rawMaterialCost: number
  energyCost: number
  laborCost: number
  overheadCost: number
  wasteCost: number
  totalCost: number
  costPerKg: number
  costPerUnit: number | null
  energyPricePerKwh: number
  ingredientBreakdown: Array<{ name: string; qtyPerKg: number; unitCost: number; totalCost: number }>
}

interface HistoryEntry {
  id: string
  calculationDate: string
  quantityKg: number
  costPerKg: number
  totalCost: number
  costRecipeId: string | null
  product: { id: string; name: string; code: string }
}

const COST_COMPONENTS = [
  { key: 'rawMaterialCost', label: 'Xamal Xərci', color: '#f59e0b', bgClass: 'bg-amber-50 dark:bg-amber-900/20', textClass: 'text-amber-700 dark:text-amber-400', icon: Layers },
  { key: 'energyCost', label: 'Enerji Xərci', color: '#3b82f6', bgClass: 'bg-blue-50 dark:bg-blue-900/20', textClass: 'text-blue-700 dark:text-blue-400', icon: Zap },
  { key: 'laborCost', label: 'Əmək Xərci', color: '#22c55e', bgClass: 'bg-green-50 dark:bg-green-900/20', textClass: 'text-green-700 dark:text-green-400', icon: Users },
  { key: 'overheadCost', label: 'Əlavə Xərclər', color: '#a855f7', bgClass: 'bg-purple-50 dark:bg-purple-900/20', textClass: 'text-purple-700 dark:text-purple-400', icon: Settings2 },
  { key: 'wasteCost', label: 'Tullantı Xərci', color: '#ef4444', bgClass: 'bg-red-50 dark:bg-red-900/20', textClass: 'text-red-700 dark:text-red-400', icon: Trash2 },
] as const

type CostKey = typeof COST_COMPONENTS[number]['key']

function pct(part: number, total: number) {
  if (total === 0) return '0%'
  return `${((part / total) * 100).toFixed(1)}%`
}

export default function MayaDeyeriPage() {
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedRecipeId, setSelectedRecipeId] = useState('')
  const [quantityKg, setQuantityKg] = useState('100')
  const [calculating, setCalculating] = useState(false)
  const [result, setResult] = useState<CostResult | null>(null)

  const { data: products = [] } = useSWR<Product[]>('/api/mehsullar', fetcher)
  const { data: recipes = [] } = useSWR<Recipe[]>(
    selectedProductId ? `/api/maya-deyeri/reseptler?productId=${selectedProductId}` : null,
    fetcher
  )
  const { data: history = [], mutate: mutateHistory } = useSWR<HistoryEntry[]>(
    '/api/maya-deyeri/tarixce?limit=20',
    fetcher,
    { refreshInterval: 60000 }
  )

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId)
    setSelectedRecipeId('')
    setResult(null)
  }

  // Auto-select default recipe when recipes load
  if (recipes.length > 0 && !selectedRecipeId) {
    const def = recipes.find(r => r.isDefault) ?? recipes[0]
    if (def) setSelectedRecipeId(def.id)
  }

  const handleCalculate = async () => {
    if (!selectedProductId || !selectedRecipeId || !quantityKg) {
      toast({ title: 'Zəhmət olmasa bütün sahələri doldurun', variant: 'destructive' })
      return
    }
    setCalculating(true)
    try {
      const res = await fetch('/api/maya-deyeri/hesabla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          recipeId: selectedRecipeId,
          quantityKg: parseFloat(quantityKg),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Xəta')
      }
      const data: CostResult = await res.json()
      setResult(data)
      mutateHistory()
      toast({ title: 'Hesablama tamamlandı', description: `Cəmi: ${formatAZN(data.totalCost)}` })
    } catch (err: unknown) {
      toast({
        title: 'Xəta baş verdi',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setCalculating(false)
    }
  }

  const pieData = result
    ? COST_COMPONENTS.map(c => ({
        name: c.label,
        value: result[c.key as CostKey],
        color: c.color,
      })).filter(d => d.value > 0)
    : []

  return (
    <div>
      <PageHeader
        title="Maya Dəyəri"
        description="Məhsul maya dəyərini hesablayın və analiz edin"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* LEFT — Calculator */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30">
              <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="font-semibold text-base">Maya Dəyəri Kalkulatoru</h2>
          </div>

          {/* Product selector */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Məhsul *</label>
            <select
              value={selectedProductId}
              onChange={e => handleProductChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Məhsul seçin —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          {/* Recipe selector */}
          {selectedProductId && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Resept *</label>
              {recipes.length === 0 ? (
                <p className="text-sm text-muted-foreground px-3 py-2 rounded-xl border border-dashed border-border">
                  Bu məhsul üçün resept mövcud deyil
                </p>
              ) : (
                <select
                  value={selectedRecipeId}
                  onChange={e => setSelectedRecipeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}{r.isDefault ? ' (Standart)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Miqdar (kg) *</label>
            <input
              type="number"
              min="1"
              step="0.1"
              value={quantityKg}
              onChange={e => setQuantityKg(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="100"
            />
          </div>

          {/* Calculate button */}
          <button
            onClick={handleCalculate}
            disabled={calculating || !selectedProductId || !selectedRecipeId || !quantityKg}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {calculating ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Hesablanır...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4" /> Hesabla
              </>
            )}
          </button>

          {/* Ingredient breakdown (if result available) */}
          {result && result.ingredientBreakdown.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                İnqredient Bölgüsü
              </p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left pb-1">Xamal</th>
                    <th className="text-right pb-1">Miq./kg</th>
                    <th className="text-right pb-1">Cəmi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.ingredientBreakdown.map((ing, i) => (
                    <tr key={i}>
                      <td className="py-1.5">{ing.name}</td>
                      <td className="text-right py-1.5">{formatNumber(ing.qtyPerKg, 3)}</td>
                      <td className="text-right py-1.5 font-medium">{formatAZN(ing.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT — Results */}
        {result ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-6 space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Total */}
            <div className="text-center pb-4 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Cəmi Maya Dəyəri</p>
              <p className="text-4xl font-bold text-foreground">{formatAZN(result.totalCost)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {formatNumber(parseFloat(quantityKg), 0)} kg üçün
              </p>
            </div>

            {/* 5 breakdown cards */}
            <div className="grid grid-cols-2 gap-3">
              {COST_COMPONENTS.map(comp => {
                const Icon = comp.icon
                const value = result[comp.key as CostKey]
                return (
                  <div
                    key={comp.key}
                    className={`rounded-xl p-3 ${comp.bgClass}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Icon className={`w-4 h-4 ${comp.textClass}`} />
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${comp.textClass} bg-white/50 dark:bg-black/20`}>
                        {pct(value, result.totalCost)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">{comp.label}</p>
                    <p className={`font-semibold text-sm mt-0.5 ${comp.textClass}`}>{formatAZN(value)}</p>
                  </div>
                )
              })}

              {/* Summary metric: AZN/kg */}
              <div className="rounded-xl p-3 bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-muted-foreground">AZN / kg</p>
                <p className="font-bold text-lg text-foreground mt-0.5">{formatAZN(result.costPerKg)}</p>
              </div>

              {/* Summary metric: AZN/ədəd (if weightGram set) */}
              {result.costPerUnit !== null && (
                <div className="rounded-xl p-3 bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-muted-foreground">AZN / ədəd</p>
                  <p className="font-bold text-lg text-foreground mt-0.5">{formatAZN(result.costPerUnit)}</p>
                </div>
              )}
            </div>

            {/* Pie chart */}
            {pieData.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Xərc Paylanması</p>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [formatAZN(value), '']}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: 'var(--background)',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      iconSize={8}
                      iconType="circle"
                      formatter={(value: string) => (
                        <span className="text-xs text-muted-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <button
              onClick={() => toast({ title: 'Hesablama saxlanıldı', description: 'Tarixçəyə əlavə edildi' })}
              className="w-full py-2.5 border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              Saxla
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-border p-6 flex flex-col items-center justify-center text-center text-muted-foreground">
            <Calculator className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-medium text-sm">Nəticə burada görünəcək</p>
            <p className="text-xs mt-1 opacity-70">Məhsul və resept seçib hesabla düyməsini basın</p>
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800">
            <History className="w-4 h-4 text-muted-foreground" />
          </div>
          <h2 className="font-semibold text-base">Hesablama Tarixçəsi</h2>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Hesablama tarixçəsi boşdur</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs border-b border-border">
                  <th className="text-left pb-3">Tarix</th>
                  <th className="text-left pb-3">Məhsul</th>
                  <th className="text-right pb-3">Miqdar (kg)</th>
                  <th className="text-right pb-3">AZN/kg</th>
                  <th className="text-right pb-3">Cəmi</th>
                  <th className="text-right pb-3">Resept</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map(entry => (
                  <tr key={entry.id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-3 text-muted-foreground">{formatDate(entry.calculationDate)}</td>
                    <td className="py-3">
                      <p className="font-medium">{entry.product.name}</p>
                      <p className="text-xs text-muted-foreground">{entry.product.code}</p>
                    </td>
                    <td className="py-3 text-right">{formatNumber(entry.quantityKg, 0)}</td>
                    <td className="py-3 text-right">{formatAZN(entry.costPerKg)}</td>
                    <td className="py-3 text-right font-semibold text-blue-600 dark:text-blue-400">
                      {formatAZN(entry.totalCost)}
                    </td>
                    <td className="py-3 text-right text-muted-foreground text-xs">
                      {entry.costRecipeId ? (
                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">resept</span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
