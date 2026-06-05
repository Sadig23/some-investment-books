'use client'
import useSWR from 'swr'
import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Download, TrendingUp, Package, DollarSign, AlertTriangle, Factory } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatAZN, formatNumber, rawMaterialTypeLabels, orderStatusLabels } from '@/lib/utils'

const fetcher = (u: string) => fetch(u).then((r) => r.json())

const TABS = [
  { key: 'istehsal', label: 'İstehsal', icon: Factory },
  { key: 'xamal', label: 'Xamal', icon: Package },
  { key: 'maliyye', label: 'Maliyyə', icon: DollarSign },
]

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316']

function defaultDates() {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - 30)
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  }
}

function KpiCard({
  label, value, sub, color = 'blue',
}: { label: string; value: string; sub?: string; color?: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600',
    orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600',
  }
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[color]?.split(' ').slice(-1)[0] ?? ''}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

export default function HesabatlarPage() {
  const [activeTab, setActiveTab] = useState('istehsal')
  const [dates, setDates] = useState(defaultDates())
  const [pendingDates, setPendingDates] = useState(defaultDates())
  const [exporting, setExporting] = useState(false)

  const dateQuery = `from=${dates.from}&to=${dates.to}`

  const { data: istehsal } = useSWR<any>(
    activeTab === 'istehsal' ? `/api/hesabatlar/istehsal?${dateQuery}` : null,
    fetcher,
  )
  const { data: xamal } = useSWR<any>(
    activeTab === 'xamal' ? '/api/hesabatlar/xamal' : null,
    fetcher,
  )
  const { data: maliyye } = useSWR<any>(
    activeTab === 'maliyye' ? `/api/hesabatlar/maliyye?${dateQuery}` : null,
    fetcher,
  )

  const applyDates = () => setDates(pendingDates)

  const handleExport = async () => {
    setExporting(true)
    try {
      const url = `/api/hesabatlar/excel?type=${activeTab}&${dateQuery}`
      const res = await fetch(url)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `hesabat-${activeTab}-${dates.to}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)
    } catch {
      // silent
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Hesabatlar"
        description="Analitika və biznes statistikası"
        action={
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'İxrac edilir...' : 'Excel İxrac'}
          </button>
        }
      />

      {/* Date range */}
      <div className="flex flex-wrap items-end gap-3 mb-6 bg-white dark:bg-gray-900 rounded-2xl border border-border p-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Başlanğıc</label>
          <input
            type="date"
            value={pendingDates.from}
            onChange={(e) => setPendingDates((p) => ({ ...p, from: e.target.value }))}
            className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Son</label>
          <input
            type="date"
            value={pendingDates.to}
            onChange={(e) => setPendingDates((p) => ({ ...p, to: e.target.value }))}
            className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={applyDates}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Tətbiq et
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted/40 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-800 shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* İstehsal tab */}
      {activeTab === 'istehsal' && (
        <div className="space-y-6">
          {!istehsal ? (
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-muted rounded-2xl" />)}
              </div>
              <div className="h-80 bg-muted rounded-2xl" />
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label="Cəmi İstehsal" value={`${formatNumber(istehsal.totalProduced)} kg`} color="blue" />
                <KpiCard label="Tullantı" value={`${formatNumber(istehsal.totalWaste)} kg`} color="orange" />
                <KpiCard label="Effektivlik" value={`${istehsal.efficiencyPercent}%`} color="green" />
                <KpiCard label="Run Sayı" value={formatNumber(istehsal.runCount, 0)} color="purple" />
              </div>

              {/* Daily trend */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" /> Gündəlik İstehsal Trendi
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={istehsal.dailyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => v.slice(5)}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v: number) => [`${formatNumber(v)} kg`, 'İstehsal']}
                      labelFormatter={(l) => `Tarix: ${l}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="qty"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#blueGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* By machine + top operators */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5">
                  <h3 className="font-semibold mb-4">Aparata Görə İstehsal</h3>
                  {istehsal.byMachine.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={istehsal.byMachine} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="machineName"
                          tick={{ fontSize: 10 }}
                          angle={-30}
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => [`${formatNumber(v)} kg`, 'İstehsal']} />
                        <Bar dataKey="totalQty" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                      Məlumat yoxdur
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5">
                  <h3 className="font-semibold mb-4">Ən Yaxşı Operatorlar</h3>
                  {istehsal.topOperators.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                          <th className="pb-2 font-medium">#</th>
                          <th className="pb-2 font-medium">Operator</th>
                          <th className="pb-2 font-medium text-right">İstehsal (kg)</th>
                          <th className="pb-2 font-medium text-right">Run sayı</th>
                        </tr>
                      </thead>
                      <tbody>
                        {istehsal.topOperators.map((op: any, i: number) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-2 text-muted-foreground">{i + 1}</td>
                            <td className="py-2 font-medium">{op.operatorName}</td>
                            <td className="py-2 text-right">{formatNumber(op.totalQty)}</td>
                            <td className="py-2 text-right text-muted-foreground">{op.runCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-center text-muted-foreground py-6 text-sm">Məlumat yoxdur</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Xamal tab */}
      {activeTab === 'xamal' && (
        <div className="space-y-6">
          {!xamal ? (
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-2xl" />)}
              </div>
              <div className="h-80 bg-muted rounded-2xl" />
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard label="Stok Dəyəri" value={formatAZN(xamal.totalStockValue)} color="blue" />
                <KpiCard
                  label="Aşağı Stok"
                  value={String(xamal.lowStockCount)}
                  sub="material azalan stokda"
                  color={xamal.lowStockCount > 0 ? 'red' : 'green'}
                />
                <KpiCard label="Material Sayı" value={String(xamal.materials.length)} color="purple" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Material table */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5 lg:col-span-2">
                  <h3 className="font-semibold mb-4">Xamal Stoku</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                          <th className="pb-2 font-medium">Ad</th>
                          <th className="pb-2 font-medium">Növ</th>
                          <th className="pb-2 font-medium">Cari Stok</th>
                          <th className="pb-2 font-medium">Min Stok</th>
                          <th className="pb-2 font-medium">Dəyər (AZN)</th>
                          <th className="pb-2 font-medium">Stok Səviyyəsi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {xamal.materials.map((m: any) => {
                          const pct = Math.min(100, (m.currentStock / Math.max(m.minStockLevel * 2, 1)) * 100)
                          return (
                            <tr
                              key={m.id}
                              className={`border-b border-border/50 ${m.isLow ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                            >
                              <td className="py-2 font-medium">
                                <div className="flex items-center gap-2">
                                  {m.isLow && <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />}
                                  {m.name}
                                </div>
                                <span className="text-xs text-muted-foreground">{m.code}</span>
                              </td>
                              <td className="py-2 text-xs text-muted-foreground">
                                {rawMaterialTypeLabels[m.type] ?? m.type}
                              </td>
                              <td className={`py-2 font-medium ${m.isLow ? 'text-red-600' : ''}`}>
                                {formatNumber(m.currentStock)} {m.unit}
                              </td>
                              <td className="py-2 text-muted-foreground">{formatNumber(m.minStockLevel)}</td>
                              <td className="py-2">{formatAZN(m.stockValue)}</td>
                              <td className="py-2 w-32">
                                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${m.isLow ? 'bg-red-500' : 'bg-green-500'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* By type pie chart */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5 lg:col-span-2">
                  <h3 className="font-semibold mb-4">Növə Görə Stok Dəyəri</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={xamal.byType}
                          dataKey="totalValue"
                          nameKey="type"
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          label={({ type, percent }: any) =>
                            `${(rawMaterialTypeLabels[type] ?? type).slice(0, 8)}: ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {xamal.byType.map((_: any, index: number) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number) => [formatAZN(v), 'Dəyər']}
                          labelFormatter={(l) => rawMaterialTypeLabels[l] ?? l}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {xamal.byType.map((t: any, i: number) => (
                        <div key={t.type} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full inline-block"
                              style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                            />
                            <span className="text-muted-foreground">{rawMaterialTypeLabels[t.type] ?? t.type}</span>
                          </div>
                          <span className="font-medium">{formatAZN(t.totalValue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Maliyyə tab */}
      {activeTab === 'maliyye' && (
        <div className="space-y-6">
          {!maliyye ? (
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-2xl" />)}
              </div>
              <div className="h-80 bg-muted rounded-2xl" />
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard label="Cəmi Sifariş Dəyəri" value={formatAZN(maliyye.totalOrderValue)} color="blue" sub={`${maliyye.orderCount} sifariş`} />
                <KpiCard label="Ödənilmiş" value={formatAZN(maliyye.totalPaid)} color="green" />
                <KpiCard label="Borc" value={formatAZN(maliyye.totalPending)} color="red" />
              </div>

              {/* Monthly revenue bar chart */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5">
                <h3 className="font-semibold mb-4">Aylıq Gəlir (Son 6 Ay)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={maliyye.monthlyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v: number) => [formatAZN(v), 'Gəlir']}
                      labelFormatter={(l) => `Ay: ${l}`}
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Status pie + top customers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5">
                  <h3 className="font-semibold mb-4">Statusa Görə Sifarişlər</h3>
                  {maliyye.ordersByStatus.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={maliyye.ordersByStatus}
                            dataKey="totalAmount"
                            nameKey="status"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                          >
                            {maliyye.ordersByStatus.map((_: any, index: number) => (
                              <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v: number) => [formatAZN(v), 'Məbləğ']}
                            labelFormatter={(l) => orderStatusLabels[l] ?? l}
                          />
                          <Legend
                            formatter={(value) => orderStatusLabels[value] ?? value}
                            iconType="circle"
                            iconSize={8}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                      Məlumat yoxdur
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5">
                  <h3 className="font-semibold mb-4">Top 5 Müştəri</h3>
                  {maliyye.topCustomers.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                          <th className="pb-2 font-medium">#</th>
                          <th className="pb-2 font-medium">Müştəri</th>
                          <th className="pb-2 font-medium text-right">Sifarişlər</th>
                          <th className="pb-2 font-medium text-right">Məbləğ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {maliyye.topCustomers.map((c: any, i: number) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-2.5 text-muted-foreground font-medium">{i + 1}</td>
                            <td className="py-2.5 font-medium">{c.customerName}</td>
                            <td className="py-2.5 text-right text-muted-foreground">{c.orderCount}</td>
                            <td className="py-2.5 text-right font-semibold text-green-600">{formatAZN(c.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-center text-muted-foreground py-6 text-sm">Məlumat yoxdur</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
