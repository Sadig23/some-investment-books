import { auth } from '@/lib/auth'
import { DashboardContent } from '@/components/dashboard/DashboardContent'

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Salafan İstehsal Sisteminə xoş gəldiniz
        </p>
      </div>
      <DashboardContent role={session?.user?.role as string ?? 'WORKER'} />
    </div>
  )
}
