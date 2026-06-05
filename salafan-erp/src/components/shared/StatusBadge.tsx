import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  // Run/Production status
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  ABORTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  // Machine status
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  MAINTENANCE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  IDLE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  BROKEN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  // Order status
  CONFIRMED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  IN_PRODUCTION: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  READY: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  // Priority
  LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  NORMAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  // Quality
  A: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  B: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  C: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  // Planned
  PLANNED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  ON_HOLD: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Gözləyir',
  IN_PROGRESS: 'Davam Edir',
  COMPLETED: 'Tamamlandı',
  ABORTED: 'Dayandırıldı',
  ACTIVE: 'Aktiv',
  MAINTENANCE: 'Texniki Xidmət',
  IDLE: 'Boş',
  BROKEN: 'Sıradan Çıxmış',
  CONFIRMED: 'Təsdiqləndi',
  IN_PRODUCTION: 'İstehsaldadır',
  READY: 'Hazırdır',
  DELIVERED: 'Çatdırıldı',
  CANCELLED: 'Ləğv Edildi',
  LOW: 'Aşağı',
  NORMAL: 'Normal',
  HIGH: 'Yüksək',
  URGENT: 'Təcili',
  A: 'A - Premium',
  B: 'B - Standart',
  C: 'C - Qüsurlu',
  PLANNED: 'Planlanmış',
  ON_HOLD: 'Dayandırılmış',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        statusColors[status] ?? 'bg-gray-100 text-gray-800',
        className
      )}
    >
      {statusLabels[status] ?? status}
    </span>
  )
}
