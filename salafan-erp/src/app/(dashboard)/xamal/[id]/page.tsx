'use client'
import useSWR from 'swr'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatNumber, formatAZN, formatDate, rawMaterialTypeLabels } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft, ShoppingCart, Settings } from 'lucide-react'
import Link from 'next/link'

const fetcher = (u: string) => fetch(u).then(r => r.json())

export default function XamalDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: mat, mutate } = useSWR(`/api/xamal/${id}`, fetcher)
  const [showPurchase, setShowPurchase] = useState(false)
  const [showAdj, setShowAdj] = useState(false)
  const [pForm, setPForm] = useState({ quantity: '', unitCost: '', supplier: '', invoiceNumber: '', notes: '' })
  const [aForm, setAForm] = useState({ quantity: '', reason: '', adjustmentType: 'CORRECTION' })
  const [loading, setLoading] = useState(false)

  if (!mat) return <div className="animate-pulse h-64 bg-muted rounded-2xl" />

  const isLow = mat.currentStock <= mat.minStockLevel

  const submitPurchase = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch('/api/xamal/alis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pForm, rawMaterialId: id, quantity: parseFloat(pForm.quantity), unitCost: parseFloat(pForm.unitCost) }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Alış qeyd edildi' })
      setShowPurchase(false)
      mutate()
    } catch { toast({ title: 'Xəta', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  const submitAdj = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch('/api/xamal/stok', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawMaterialId: id, ...aForm, quantity: parseFloat(aForm.quantity) }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Stok yeniləndi' })
      setShowAdj(false)
      mutate()
    } catch { toast({ title: 'Xəta', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <Link href="/xamal" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Geri
      </Link>
      <PageHeader
        title={mat.name}
        description={`${mat.code} • ${rawMaterialTypeLabels[mat.type] ?? mat.type}`}
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowPurchase(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium">
              <ShoppingCart className="w-4 h-4" /> Alış
            </button>
            <button onClick={() => setShowAdj(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm hover:bg-accent">
              <Settings className="w-4 h-4" /> Düzəliş
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Cari Stok', value: `${formatNumber(mat.currentStock)} ${mat.unit}`, alert: isLow },
          { label: 'Min Stok', value: `${formatNumber(mat.minStockLevel)} ${mat.unit}` },
          { label: 'Vahid Qiymət', value: formatAZN(mat.unitCost) },
          { label: 'Ümumi Dəyər', value: formatAZN(mat.currentStock * mat.unitCost) },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.alert ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' : 'border-border bg-white dark:bg-gray-900'}`}>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.alert ? 'text-orange-600' : ''}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Purchase history */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5 mb-4">
        <h3 className="font-semibold mb-4">Alış Tarixçəsi</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2">Tarix</th><th className="pb-2">Miqdar</th><th className="pb-2">Qiymət</th><th className="pb-2">Cəm</th><th className="pb-2">Təchizatçı</th>
            </tr></thead>
            <tbody>{(mat.purchases ?? []).map((p: any) => (
              <tr key={p.id} className="border-b border-border/50">
                <td className="py-2">{formatDate(p.purchaseDate)}</td>
                <td className="py-2">{formatNumber(p.quantity)} {mat.unit}</td>
                <td className="py-2">{formatAZN(p.unitCost)}</td>
                <td className="py-2 font-medium">{formatAZN(p.totalCost)}</td>
                <td className="py-2 text-muted-foreground">{p.supplier}</td>
              </tr>
            ))}</tbody>
          </table>
          {mat.purchases?.length === 0 && <p className="text-center text-muted-foreground py-4">Alış yoxdur</p>}
        </div>
      </div>

      {/* Purchase modal */}
      {showPurchase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold mb-4">Yeni Alış - {mat.name}</h3>
            <form onSubmit={submitPurchase} className="space-y-3">
              {[
                { label: 'Miqdar', key: 'quantity', type: 'number' },
                { label: 'Vahid Qiymət (AZN)', key: 'unitCost', type: 'number' },
                { label: 'Təchizatçı', key: 'supplier', type: 'text' },
                { label: 'Faktura №', key: 'invoiceNumber', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium mb-1">{f.label}</label>
                  <input required={f.key !== 'invoiceNumber'} type={f.type} step="0.01"
                    value={(pForm as any)[f.key]} onChange={e => setPForm(p => ({...p, [f.key]: e.target.value}))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-60">
                  {loading ? 'Saxlanır...' : 'Alışı Qeyd Et'}
                </button>
                <button type="button" onClick={() => setShowPurchase(false)} className="px-4 py-2.5 border border-border rounded-xl text-sm">Ləğv</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjustment modal */}
      {showAdj && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold mb-4">Stok Düzəlişi</h3>
            <form onSubmit={submitAdj} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Miqdar (+ əlavə, - azalt)</label>
                <input required type="number" step="0.01" value={aForm.quantity} onChange={e => setAForm(p => ({...p, quantity: e.target.value}))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Səbəb</label>
                <input required value={aForm.reason} onChange={e => setAForm(p => ({...p, reason: e.target.value}))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-60">
                  {loading ? 'Saxlanır...' : 'Tətbiq Et'}
                </button>
                <button type="button" onClick={() => setShowAdj(false)} className="px-4 py-2.5 border border-border rounded-xl text-sm">Ləğv</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
