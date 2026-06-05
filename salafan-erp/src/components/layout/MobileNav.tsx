'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Package, Factory, BarChart3,
  MoreHorizontal, X, Calculator, RefreshCw, Printer,
  Scissors, Cpu, Users, ShoppingCart, Box
} from 'lucide-react'

const mainTabs = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/xamal', label: 'Xamal', icon: Package },
  { href: '/istehsal', label: 'İstehsal', icon: Factory },
  { href: '/aparatlar', label: 'Aparatlar', icon: Cpu },
]

const moreItems = [
  { href: '/geri-donusum', label: 'Geri Dönüşüm', icon: RefreshCw },
  { href: '/cap', label: 'Çap', icon: Printer },
  { href: '/kesme', label: 'Kəsmə', icon: Scissors },
  { href: '/maya-deyeri', label: 'Maya Dəyəri', icon: Calculator, adminOnly: true },
  { href: '/mehsullar', label: 'Məhsullar', icon: Box, adminOnly: true },
  { href: '/musteriler', label: 'Müştərilər', icon: Users, adminOnly: true },
  { href: '/sifarisler', label: 'Sifarişlər', icon: ShoppingCart, adminOnly: true },
  { href: '/hesabatlar', label: 'Hesabatlar', icon: BarChart3, adminOnly: true },
]

export function MobileNav({ role }: { role: string }) {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  const filtered = moreItems.filter(
    (item) => !item.adminOnly || role === 'ADMIN'
  )

  return (
    <>
      {/* Bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border z-40 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {mainTabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-500 dark:text-gray-400 min-w-[60px]"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">Daha çox</span>
          </button>
        </div>
      </nav>

      {/* More sheet */}
      {showMore && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50 md:hidden"
            onClick={() => setShowMore(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl z-50 md:hidden shadow-xl">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="font-semibold">Bütün Modullar</h3>
              <button onClick={() => setShowMore(false)} className="p-1 rounded-lg hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 p-4">
              {filtered.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl transition-colors',
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="text-xs font-medium text-center">{item.label}</span>
                  </Link>
                )
              })}
            </div>
            <div className="h-6" />
          </div>
        </>
      )}
    </>
  )
}
