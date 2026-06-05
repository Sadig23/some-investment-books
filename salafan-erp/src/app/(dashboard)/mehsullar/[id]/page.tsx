'use client'
import useSWR from 'swr'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, Edit2, Check, X, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatAZN, formatNumber, formatDate } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const fetcher = (u: string) => fetch(u).then(r => r.json())

const typeLabels: Record<string, string> = {
  FILM_ROLL: 'Film Rulosu',
  BAG_PLAIN: 'Sadə Torba',
  BAG_PRINTED: 'Çaplı Torba',
}

const typeBadgeClasses: Record<string, string> = {
  FILM_ROLL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  BAG_PLAIN: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  BAG_PRINTED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

interface CostCalc {
  id: string
  calculationDate: string
  quantityKg: number
  costPerKg: number
  totalCost: number
  costRecipeId: string | null
}

interface Ingredient {
  id: string
  qtyPerKg: number
  rawMaterial: { id: string; name: string; unit: string; unitCost: number }
}

interface Recipe {
  id: string
  name: string
  isDefault: boolean
  energyKwhPerKg: number
  laborCostPerKg: number
  overheadPerKg: number
  wasteFactor: number
  ingredients: Ingredient[]
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
  description: string | null
  isActive: boolean
  costRecipes: Recipe[]
  costCalculations: CostCalc[]
}

export default function MehsulDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: product, mutate, isLoading } = useSWR<Product>(`/api/mehsullar/${id}`, fetcher)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Product>>({})
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null)

  const startEdit = () => {
    if (!product) return
    setEditForm({
      name: product.name,
      code: product.code,
      type: product.type,
      unit: product.unit,
      widthMm: product.widthMm,
      lengthMm: product.lengthMm,
      thicknessMicron: product.thicknessMicron,
      weightGram: product.weightGram,
      colorSpec: product.colorSpec,
      description: product.description,
    })
    setEditing(true)
  }

  const cancelEdit = () => setEditing(false)

  const saveEdit = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/mehsullar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Məhsul yeniləndi' })
      mutate()
      setEditing(false)
    } catch {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bu məhsulu silmək istədiyinizdən əminsiniz?')) return
    try {
      await fetch(`/api/mehsullar/${id}`, { method: 'DELETE' })
      toast({ title: 'Məhsul silindi' })
      router.push('/mehsullar')
    } catch {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-48 rounded-2xl bg-gray-100 dark:bg-gray-800" />
        <div className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-800" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Məhsul tapılmadı</p>
        <Link href="/mehsullar" className="mt-4 inline-block text-blue-600 text-sm hover:underline">
          Geri qayıt
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/mehsullar"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Məhsullara qayıt
        </Link>
        <div className="flex items-center gap-2">
          {!editing && (
            <>
              <button
                onClick={startEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl border border-border hover:bg-accent transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" /> Düzəliş
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Sil
              </button>
            </>
          )}
        </div>
      </div>

      <PageHeader title={product.name} />

      {/* Info card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Məhsul kodu</p>
              <p className="font-mono font-semibold text-sm">{product.code}</p>
            </div>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${typeBadgeClasses[product.type] ?? ''}`}>
            {typeLabels[product.type] ?? product.type}
          </span>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Ad *</label>
                <input
                  required
                  value={editForm.name ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Kod</label>
                <input
                  value={editForm.code ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, code: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Növ</label>
                <select
                  value={editForm.type ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))}
                  className={inputClass}
                >
                  <option value="FILM_ROLL">Film Rulosu</option>
                  <option value="BAG_PLAIN">Sadə Torba</option>
                  <option value="BAG_PRINTED">Çaplı Torba</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Vahid</label>
                <input
                  value={editForm.unit ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, unit: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">En (mm)</label>
                <input
                  type="number"
                  value={editForm.widthMm ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, widthMm: e.target.value ? parseFloat(e.target.value) : null }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Boy (mm)</label>
                <input
                  type="number"
                  value={editForm.lengthMm ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, lengthMm: e.target.value ? parseFloat(e.target.value) : null }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Qalınlıq (µm)</label>
                <input
                  type="number"
                  value={editForm.thicknessMicron ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, thicknessMicron: e.target.value ? parseFloat(e.target.value) : null }))}
                  className={inputClass}
                />
              </div>
              {editForm.type !== 'FILM_ROLL' && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Çəki (q)</label>
                  <input
                    type="number"
                    value={editForm.weightGram ?? ''}
                    onChange={e => setEditForm(p => ({ ...p, weightGram: e.target.value ? parseFloat(e.target.value) : null }))}
                    className={inputClass}
                  />
                </div>
              )}
              {editForm.type === 'BAG_PRINTED' && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Rəng spesifikasiyası</label>
                  <input
                    value={editForm.colorSpec ?? ''}
                    onChange={e => setEditForm(p => ({ ...p, colorSpec: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Açıqlama</label>
              <textarea
                value={editForm.description ?? ''}
                onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                rows={2}
                className={inputClass}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={saveEdit}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Check className="w-4 h-4" /> {saving ? 'Saxlanır...' : 'Saxla'}
              </button>
              <button
                onClick={cancelEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-xl text-sm hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4" /> Ləğv
              </button>
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs">Vahid</dt>
              <dd className="font-medium mt-0.5">{product.unit}</dd>
            </div>
            {product.widthMm && (
              <div>
                <dt className="text-muted-foreground text-xs">En</dt>
                <dd className="font-medium mt-0.5">{formatNumber(product.widthMm, 1)} mm</dd>
              </div>
            )}
            {product.lengthMm && (
              <div>
                <dt className="text-muted-foreground text-xs">Boy</dt>
                <dd className="font-medium mt-0.5">{formatNumber(product.lengthMm, 1)} mm</dd>
              </div>
            )}
            {product.thicknessMicron && (
              <div>
                <dt className="text-muted-foreground text-xs">Qalınlıq</dt>
                <dd className="font-medium mt-0.5">{formatNumber(product.thicknessMicron, 1)} µm</dd>
              </div>
            )}
            {product.weightGram && (
              <div>
                <dt className="text-muted-foreground text-xs">Çəki</dt>
                <dd className="font-medium mt-0.5">{formatNumber(product.weightGram, 2)} q</dd>
              </div>
            )}
            {product.colorSpec && (
              <div>
                <dt className="text-muted-foreground text-xs">Rəng</dt>
                <dd className="font-medium mt-0.5">{product.colorSpec}</dd>
              </div>
            )}
            {product.description && (
              <div className="col-span-full">
                <dt className="text-muted-foreground text-xs">Açıqlama</dt>
                <dd className="font-medium mt-0.5">{product.description}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {/* Cost Recipes */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">Maya Dəyəri Reseptləri</h2>
          <Link
            href="/maya-deyeri/reseptler"
            className="text-xs text-blue-600 hover:underline"
          >
            Bütün reseptlər
          </Link>
        </div>

        {product.costRecipes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Bu məhsul üçün resept mövcud deyil
          </p>
        ) : (
          <div className="space-y-3">
            {product.costRecipes.map(recipe => (
              <div key={recipe.id} className="rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{recipe.name}</span>
                    {recipe.isDefault && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        Standart
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {recipe.ingredients.length} inqredient
                  </span>
                </button>

                {expandedRecipe === recipe.id && (
                  <div className="px-4 pb-4 border-t border-border bg-gray-50 dark:bg-gray-800/30">
                    <div className="grid grid-cols-3 gap-2 mt-3 mb-3 text-xs text-muted-foreground">
                      <span>Enerji: {recipe.energyKwhPerKg} kWh/kg</span>
                      <span>Əmək: {formatAZN(recipe.laborCostPerKg)}/kg</span>
                      <span>Əlavə: {formatAZN(recipe.overheadPerKg)}/kg</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Tullantı faktoru: {(recipe.wasteFactor * 100).toFixed(1)}%
                    </p>
                    {recipe.ingredients.length > 0 && (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="text-left pb-1">Xamal</th>
                            <th className="text-right pb-1">Miq./kg</th>
                            <th className="text-right pb-1">Qiymət</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {recipe.ingredients.map(ing => (
                            <tr key={ing.id}>
                              <td className="py-1">{ing.rawMaterial.name}</td>
                              <td className="text-right py-1">
                                {formatNumber(ing.qtyPerKg, 3)} {ing.rawMaterial.unit}
                              </td>
                              <td className="text-right py-1">{formatAZN(ing.rawMaterial.unitCost)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Last 5 Cost Calculations */}
      {product.costCalculations.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base">Son Hesablamalar</h2>
            <Link href="/maya-deyeri" className="text-xs text-blue-600 hover:underline">
              Bütün tarixçə
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs border-b border-border">
                  <th className="text-left pb-2">Tarix</th>
                  <th className="text-right pb-2">Miqdar (kg)</th>
                  <th className="text-right pb-2">AZN/kg</th>
                  <th className="text-right pb-2">Cəmi məbləğ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {product.costCalculations.map(calc => (
                  <tr key={calc.id}>
                    <td className="py-2.5 text-muted-foreground">{formatDate(calc.calculationDate)}</td>
                    <td className="py-2.5 text-right">{formatNumber(calc.quantityKg, 0)} kg</td>
                    <td className="py-2.5 text-right font-medium">{formatAZN(calc.costPerKg)}</td>
                    <td className="py-2.5 text-right font-semibold text-blue-600 dark:text-blue-400">
                      {formatAZN(calc.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
