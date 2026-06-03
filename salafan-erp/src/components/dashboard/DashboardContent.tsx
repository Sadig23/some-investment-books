'use client'

import useSWR from 'swr'
import { formatAZN, formatNumber, runStatusLabels } from '@/lib/utils'
import {
  Factory, Package, Cpu, ShoppingCart,
  TrendingUp, TrendingDown, AlertTriangle,
  RefreshCw, CheckCircle2, Clock
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDateTime } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface DashboardContentProps {
  role: string
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function DashboardContent({ role }: DashboardContentProps) {
  const { data, isLoading } = useSWR('/api/dashboard/kpis', fetcher, {
    refreshInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const kpis = [
    {
      title: 'Bu gün istehsal',
      value: formatNumber(data?.todayProduction ?? 0),
      unit: 'kg',
      icon: Factory,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
      trend: null,
    },
    {
      title: 'Aktiv sifarişlər',
      value: data?.activeOrders ?? 0,
      unit: 'sifariş',
      icon: ShoppingCart,
      color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
      trend: null,
    },
    {
      title: 'Aylıq gəlir',
      value: formatAZN(data?.monthRevenue ?? 0),
      unit: '',
      icon: TrendingUp,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
      trend: data?.lastMonthRevenue > 0
        ? Math.round(((data.monthRevenue - data.lastMonthRevenue) / data.lastMonthRevenue) * 100)
        : null,
    },
    {
      title: 'Aktiv aparatlar',
      value: data?.activeMachines ?? 0,
      unit: 'aparat',
      icon: Cpu,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
      trend: null,
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-xl ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              {kpi.trend !== null && (
                <span className={`text-xs font-medium flex items-center gap-1 ${kpi.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(kpi.trend)}%
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{kpi.title}{kpi.unit ? ` (${kpi.unit})` : ''}</p>
          </div>
        ))}
      </div>

      {/* Alerts row */}
      {(data?.lowStockCount > 0 || data?.recyclingEfficiency < 70) && (
        <div className="flex flex-wrap gap-3">
          {data?.lowStockCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span><strong>{data.lowStockCount}</strong> xamal aşağı stokdadır</span>
            </div>
          )}
          {data?.recyclingEfficiency < 70 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 text-sm">
              <RefreshCw className="w-4 h-4 flex-shrink-0" />
              <span>Geri dönüşüm effektivliyi: <strong>{data.recyclingEfficiency}%</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold mb-4">Son 7 Gün İstehsal (kg)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data?.productionByDay ?? []}>
              <defs>
                <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                formatter={(v: any) => [`${formatNumber(v)} kg`, 'İstehsal']}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorProd)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Machine status */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold mb-4">Aparat Statusu</h3>
          {data?.machineStatus?.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data.machineStatus.map((s: any, i: number) => ({
                    name: s.status === 'ACTIVE' ? 'Aktiv' : s.status === 'MAINTENANCE' ? 'Texniki' : s.status === 'IDLE' ? 'Boş' : 'Sıradan',
                    value: s._count,
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {data.machineStatus.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">Aparat yoxdur</p>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-orange-500" />
            Stok Vəziyyəti
          </h3>
          <div className="space-y-3">
            {(data?.lowStock ?? []).map((mat: any) => {
              const pct = Math.min(100, (mat.currentStock / Math.max(mat.minStockLevel * 2, 1)) * 100)
              const isLow = mat.currentStock <= mat.minStockLevel
              return (
                <div key={mat.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{mat.name}</span>
                    <span className={`text-xs ${isLow ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                      {formatNumber(mat.currentStock)} {mat.unit}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={`h-2 rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {(!data?.lowStock || data.lowStock.length === 0) && (
              <div className="flex items-center gap-2 text-green-600 text-sm py-2">
                <CheckCircle2 className="w-4 h-4" />
                Bütün xamallar normal səviyyədədir
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Son İstehsal Fəaliyyəti
          </h3>
          <div className="space-y-3">
            {(data?.recentActivity ?? []).map((run: any) => (
              <div key={run.id} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {run.productionOrder?.product?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {run.machine?.name} • {run.operator?.name}
                  </p>
                </div>
                <StatusBadge status={run.status} />
              </div>
            ))}
            {(!data?.recentActivity || data.recentActivity.length === 0) && (
              <p className="text-sm text-muted-foreground py-2">Hal-hazırda fəaliyyət yoxdur</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
