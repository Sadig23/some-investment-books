'use client'
import useSWR from 'swr'
import { useState, useCallback } from 'react'
import { Plus, ChevronDown, ChevronRight, X, Trash2, BookOpen } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatAZN, formatNumber } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const fetcher = (u: string) => fetch(u).then(r => r.json())

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const labelClass = 'block text-xs font-medium mb-1 text-muted-foreground'

interface Product {
  id: string
  name: string
  code: string
}

interface RawMaterial {
  id: string
  name: string
  unit: string
  unitCost: number
}

interface Ingredient {
  id: string
  qtyPerKg: number
  rawMaterial: { id: string; name: string; unit: string; unitCost: number }
}

interface Recipe {
  id: string
  productId: string
  name: string
  isDefault: boolean
  energyKwhPerKg: number
  laborCostPerKg: number
  overheadPerKg: number
  wasteFactor: number
  ingredients: Ingredient[]
  product: { id: string; name: string; code: string }
  _count: { ingredients: number }
}

interface IngredientRow {
  rawMaterialId: string
  qtyPerKg: string
}

interface RecipeForm {
  productId: string
  name: string
  isDefault: boolean
  energyKwhPerKg: string
  laborCostPerKg: string
  overheadPerKg: string
  wasteFactor: string
  ingredients: IngredientRow[]
}

const emptyForm = (): RecipeForm => ({
  productId: '',
  name: '',
  isDefault: false,
  energyKwhPerKg: '0',
  laborCostPerKg: '0',
  overheadPerKg: '0',
  wasteFactor: '0.05',
  ingredients: [{ rawMaterialId: '', qtyPerKg: '' }],
})

// Group recipes by product
function groupByProduct(recipes: Recipe[]): Map<string, Recipe[]> {
  const map = new Map<string, Recipe[]>()
  for (const r of recipes) {
    const existing = map.get(r.productId) ?? []
    map.set(r.productId, [...existing, r])
  }
  return map
}

export default function ReseptlerPage() {
  const { data: recipes = [], mutate, isLoading } = useSWR<Recipe[]>('/api/maya-deyeri/reseptler', fetcher, { refreshInterval: 60000 })
  const { data: products = [] } = useSWR<Product[]>('/api/mehsullar', fetcher)
  const { data: rawMaterials = [] } = useSWR<RawMaterial[]>('/api/xamal', fetcher)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<RecipeForm>(emptyForm())
  const [submitting, setSubmitting] = useState(false)
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(new Set())
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())

  const toggleRecipe = useCallback((id: string) => {
    setExpandedRecipes(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const toggleProduct = useCallback((id: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const addIngredientRow = () =>
    setForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { rawMaterialId: '', qtyPerKg: '' }],
    }))

  const removeIngredientRow = (index: number) =>
    setForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }))

  const updateIngredientRow = (index: number, field: keyof IngredientRow, value: string) =>
    setForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      ),
    }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.productId || !form.name) {
      toast({ title: 'Məhsul və resept adı tələb olunur', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const validIngredients = form.ingredients.filter(
        ing => ing.rawMaterialId && ing.qtyPerKg
      )
      const payload = {
        productId: form.productId,
        name: form.name,
        isDefault: form.isDefault,
        energyKwhPerKg: parseFloat(form.energyKwhPerKg || '0'),
        laborCostPerKg: parseFloat(form.laborCostPerKg || '0'),
        overheadPerKg: parseFloat(form.overheadPerKg || '0'),
        wasteFactor: parseFloat(form.wasteFactor || '0.05'),
        ingredients: validIngredients.map(ing => ({
          rawMaterialId: ing.rawMaterialId,
          qtyPerKg: parseFloat(ing.qtyPerKg),
        })),
      }
      const res = await fetch('/api/maya-deyeri/reseptler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Xəta')
      }
      toast({ title: 'Resept əlavə edildi' })
      mutate()
      setShowModal(false)
      setForm(emptyForm())
    } catch (err: unknown) {
      toast({
        title: 'Xəta baş verdi',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (recipeId: string, recipeName: string) => {
    if (!confirm(`"${recipeName}" reseptini silmək istədiyinizdən əminsiniz?`)) return
    try {
      const res = await fetch(`/api/maya-deyeri/reseptler/${recipeId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'Resept silindi' })
      mutate()
    } catch {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' })
    }
  }

  const grouped = groupByProduct(recipes)
  const totalRecipes = recipes.length

  return (
    <div>
      <PageHeader
        title="Maya Dəyəri Reseptləri"
        description="Məhsullar üçün xamal reseptlərini idarə edin"
        action={
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium">
              {isLoading ? '...' : totalRecipes}
            </span>
            <button
              onClick={() => { setForm(emptyForm()); setShowModal(true) }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Yeni Resept
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Resept tapılmadı</p>
          <p className="text-sm mt-1 opacity-70">Yeni resept əlavə etmək üçün düyməni basın</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([productId, productRecipes]) => {
            const firstRecipe = productRecipes[0]
            const productName = firstRecipe.product.name
            const productCode = firstRecipe.product.code
            const isProductExpanded = expandedProducts.has(productId)

            return (
              <div key={productId} className="bg-white dark:bg-gray-900 rounded-2xl border border-border overflow-hidden">
                {/* Product header */}
                <button
                  onClick={() => toggleProduct(productId)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isProductExpanded
                      ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    }
                    <div>
                      <p className="font-semibold text-sm">{productName}</p>
                      <p className="text-xs text-muted-foreground">{productCode}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-muted-foreground font-medium">
                    {productRecipes.length} resept
                  </span>
                </button>

                {/* Recipes list */}
                {isProductExpanded && (
                  <div className="border-t border-border divide-y divide-border">
                    {productRecipes.map(recipe => {
                      const isExpanded = expandedRecipes.has(recipe.id)
                      return (
                        <div key={recipe.id}>
                          {/* Recipe row */}
                          <div className="flex items-center justify-between px-5 py-3 hover:bg-accent/30 transition-colors">
                            <button
                              onClick={() => toggleRecipe(recipe.id)}
                              className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                            >
                              {isExpanded
                                ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                              }
                              <span className="text-sm font-medium truncate">{recipe.name}</span>
                              {recipe.isDefault && (
                                <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                  Standart
                                </span>
                              )}
                              <span className="flex-shrink-0 text-xs text-muted-foreground">
                                {recipe._count.ingredients} ing.
                              </span>
                            </button>
                            <button
                              onClick={() => handleDelete(recipe.id, recipe.name)}
                              className="ml-3 p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Expanded recipe details */}
                          {isExpanded && (
                            <div className="px-5 pb-4 bg-gray-50 dark:bg-gray-800/30">
                              {/* Params */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-border">
                                <div>
                                  <p className="text-xs text-muted-foreground">Enerji</p>
                                  <p className="text-sm font-medium">{recipe.energyKwhPerKg} kWh/kg</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Əmək</p>
                                  <p className="text-sm font-medium">{formatAZN(recipe.laborCostPerKg)}/kg</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Əlavə</p>
                                  <p className="text-sm font-medium">{formatAZN(recipe.overheadPerKg)}/kg</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Tullantı</p>
                                  <p className="text-sm font-medium">{(recipe.wasteFactor * 100).toFixed(1)}%</p>
                                </div>
                              </div>

                              {/* Ingredients */}
                              {recipe.ingredients.length > 0 ? (
                                <div className="pt-3">
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                    İnqredientlər
                                  </p>
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="text-muted-foreground">
                                        <th className="text-left pb-1.5">Xamal</th>
                                        <th className="text-right pb-1.5">Miqdar/kg</th>
                                        <th className="text-right pb-1.5">Vahid qiymət</th>
                                        <th className="text-right pb-1.5">Xərc/kg</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                      {recipe.ingredients.map(ing => (
                                        <tr key={ing.id}>
                                          <td className="py-1.5">{ing.rawMaterial.name}</td>
                                          <td className="text-right py-1.5">
                                            {formatNumber(ing.qtyPerKg, 3)} {ing.rawMaterial.unit}
                                          </td>
                                          <td className="text-right py-1.5">{formatAZN(ing.rawMaterial.unitCost)}</td>
                                          <td className="text-right py-1.5 font-medium">
                                            {formatAZN(ing.qtyPerKg * ing.rawMaterial.unitCost)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground pt-3">İnqredient yoxdur</p>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Dialog */}
          <div className="relative bg-background rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-semibold text-base">Yeni Resept</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Product selector */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Məhsul *</label>
                <select
                  required
                  value={form.productId}
                  onChange={e => setForm(prev => ({ ...prev, productId: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">— Məhsul seçin —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Name + isDefault */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Resept adı *</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className={inputClass}
                    placeholder="Məs. Standart Qarışıq"
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={form.isDefault}
                    onChange={e => setForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <label htmlFor="isDefault" className="text-sm font-medium cursor-pointer">
                    Standart resept kimi təyin et
                  </label>
                </div>
              </div>

              {/* Cost parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className={labelClass}>Enerji (kWh/kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.energyKwhPerKg}
                    onChange={e => setForm(prev => ({ ...prev, energyKwhPerKg: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Əmək (AZN/kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.laborCostPerKg}
                    onChange={e => setForm(prev => ({ ...prev, laborCostPerKg: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Əlavə (AZN/kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.overheadPerKg}
                    onChange={e => setForm(prev => ({ ...prev, overheadPerKg: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tullantı faktoru</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.001"
                    value={form.wasteFactor}
                    onChange={e => setForm(prev => ({ ...prev, wasteFactor: e.target.value }))}
                    className={inputClass}
                    placeholder="0.05"
                  />
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">İnqredientlər</label>
                  <button
                    type="button"
                    onClick={addIngredientRow}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Sətir əlavə et
                  </button>
                </div>

                <div className="space-y-2">
                  {form.ingredients.map((row, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <select
                          value={row.rawMaterialId}
                          onChange={e => updateIngredientRow(index, 'rawMaterialId', e.target.value)}
                          className={inputClass}
                        >
                          <option value="">— Xamal seçin —</option>
                          {rawMaterials.map((mat: RawMaterial) => (
                            <option key={mat.id} value={mat.id}>
                              {mat.name} ({formatAZN(mat.unitCost)}/{mat.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-28 flex-shrink-0">
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={row.qtyPerKg}
                          onChange={e => updateIngredientRow(index, 'qtyPerKg', e.target.value)}
                          className={inputClass}
                          placeholder="miq/kg"
                        />
                      </div>
                      {form.ingredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeIngredientRow(index)}
                          className="p-2 mt-0.5 rounded-xl border border-border text-muted-foreground hover:text-red-600 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-border">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  {submitting ? 'Saxlanır...' : 'Resepti Saxla'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 border border-border rounded-xl text-sm hover:bg-accent transition-colors"
                >
                  Ləğv Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
