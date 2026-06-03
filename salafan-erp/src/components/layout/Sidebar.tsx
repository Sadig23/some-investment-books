'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Package, Cpu, Factory, RefreshCw,
  Printer, Scissors, Calculator, Users, ShoppingCart,
  Box, BarChart3, ChevronLeft, ChevronRight, Settings,
  FileText
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'WORKER'] },
  { href: '/xamal', label: 'Xamal', icon: Package, roles: ['ADMIN', 'WORKER'] },
  { href: '/aparatlar', label: 'Aparatlar', icon: Cpu, roles: ['ADMIN', 'WORKER'] },
  { href: '/istehsal', label: 'İstehsal', icon: Factory, roles: ['ADMIN', 'WORKER'] },
  { href: '/geri-donusum', label: 'Geri Dönüşüm', icon: RefreshCw, roles: ['ADMIN', 'WORKER'] },
  { href: '/cap', label: 'Çap', icon: Printer, roles: ['ADMIN', 'WORKER'] },
  { href: '/kesme', label: 'Kəsmə', icon: Scissors, roles: ['ADMIN', 'WORKER'] },
  { href: '/maya-deyeri', label: 'Maya Dəyəri', icon: Calculator, roles: ['ADMIN'] },
  { href: '/mehsullar', label: 'Məhsullar', icon: Box, roles: ['ADMIN'] },
  { href: '/musteriler', label: 'Müştərilər', icon: Users, roles: ['ADMIN'] },
  { href: '/sifarisler', label: 'Sifarişlər', icon: ShoppingCart, roles: ['ADMIN'] },
  { href: '/isci', label: 'İşçilər', icon: Users, roles: ['ADMIN'] },
  { href: '/hesabatlar', label: 'Hesabatlar', icon: BarChart3, roles: ['ADMIN'] },
]

interface SidebarProps {
  role: string
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const filtered = navItems.filter((item) => item.roles.includes(role))

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-white dark:bg-gray-900 border-r border-border sidebar-transition',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-border',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Factory className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">Salafan</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Factory className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800',
            collapsed && 'hidden'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Collapsed expand button */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {filtered.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
              )}
            >
              <item.icon className={cn('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-border p-4">
          <p className="text-xs text-muted-foreground text-center">Salafan ERP v1.0</p>
        </div>
      )}
    </aside>
  )
}
