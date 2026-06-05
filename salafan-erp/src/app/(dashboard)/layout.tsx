import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar role={session.user.role as string} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={session.user as any} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav role={session.user.role as string} />

      {/* Attribution */}
      <div className="fixed bottom-2 right-3 z-50 hidden md:block">
        <span className="text-[10px] text-muted-foreground/40 font-medium tracking-wide select-none hover:text-muted-foreground/70 transition-colors">
          Created by Sadig Yusifli
        </span>
      </div>
    </div>
  )
}
