'use client'

import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Moon, Sun, LogOut, User, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string
  }
}

export function Header({ user }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <header className="h-16 border-b border-border bg-white dark:bg-gray-900 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      {/* Left: Page title area (filled by children via context if needed) */}
      <div className="flex items-center gap-2">
        <div className="hidden md:block">
          <p className="text-sm text-muted-foreground">
            Xoş gəldiniz, <span className="font-medium text-foreground">{user.name}</span>
          </p>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {user.name?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user.role === 'ADMIN' ? 'Administrator' : 'İşçi'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden md:block" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl border border-border shadow-lg z-20 py-1">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Çıxış
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
