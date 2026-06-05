'use client'
import useSWR from 'swr'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Users, ChevronRight, Phone, Mail } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'

const fetcher = (u: string) => fetch(u).then((r) => r.json())

interface Customer {
  id: string
  name: string
  code: string
  contactName: string | null
  phone: string | null
  email: string | null
  address: string | null
  isActive: boolean
  _count: { orders: number }
}

export default function MusterilerPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedSearch(search), 400)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [search])

  const { data: customers = [] } = useSWR<Customer[]>(
    `/api/musteriler?search=${debouncedSearch}`,
    fetcher
  )

  return (
    <div>
      <PageHeader
        title="Müştərilər"
        description="Müştəri idarəetməsi və sifariş tarixçəsi"
        action={
          <Link
            href="/musteriler/yeni"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Yeni Müştəri
          </Link>
        }
      />

      {/* Search */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad, əlaqə şəxsi və ya telefon axtar..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white dark:bg-gray-900 rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Ad</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Əlaqə şəxsi</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Telefon</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Sifarişlər</th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground">Əməliyyatlar</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr
                key={c.id}
                className="border-b border-border/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
              >
                <td className="px-5 py-3">
                  <div className="font-medium text-foreground">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.code}</div>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{c.contactName ?? '—'}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  {c.phone ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {c.phone}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {c.email ? (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {c.email}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {c._count.orders}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/musteriler/${c.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-accent transition-colors"
                  >
                    Ətraflı <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {customers.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Müştəri tapılmadı</p>
            {search && (
              <p className="text-sm mt-1">
                &ldquo;{search}&rdquo; axtarışı üzrə nəticə yoxdur
              </p>
            )}
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {customers.map((c) => (
          <Link
            key={c.id}
            href={`/musteriler/${c.id}`}
            className="block bg-white dark:bg-gray-900 rounded-2xl border border-border p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.code}</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {c._count.orders} sifariş
              </span>
            </div>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              {c.contactName && <p>{c.contactName}</p>}
              {c.phone && (
                <p className="inline-flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {c.phone}
                </p>
              )}
              {c.email && (
                <p className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {c.email}
                </p>
              )}
            </div>
            <div className="mt-3 flex justify-end">
              <span className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium">
                Ətraflı <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        ))}

        {customers.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Müştəri tapılmadı</p>
          </div>
        )}
      </div>
    </div>
  )
}
