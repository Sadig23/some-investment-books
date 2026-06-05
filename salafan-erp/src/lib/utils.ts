import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAZN(amount: number): string {
  return new Intl.NumberFormat('az-AZ', {
    style: 'currency',
    currency: 'AZN',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(num: number, decimals = 2): string {
  return new Intl.NumberFormat('az-AZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num)
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'dd.MM.yyyy')
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'dd.MM.yyyy HH:mm')
}

export function generateOrderNumber(prefix: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const random = Math.floor(Math.random() * 9000) + 1000
  return `${prefix}-${year}-${random}`
}

export const rawMaterialTypeLabels: Record<string, string> = {
  LDPE_GRANULE: 'LDPE Qranul',
  HDPE_GRANULE: 'HDPE Qranul',
  PIGMENT: 'Piqment/Boya',
  INK: 'Mürəkkəb',
  ADDITIVE: 'Qatqı',
  RECYCLED_GRANULE: 'Geri Dönüşüm Qranulu',
  OTHER: 'Digər',
}

export const machineTypeLabels: Record<string, string> = {
  EXTRUSION: 'Ekstruziya',
  PRINTING: 'Çap',
  CUTTING: 'Kəsmə',
  RECYCLING: 'Geri Dönüşüm',
  SEALING: 'Möhürləmə',
  OTHER: 'Digər',
}

export const machineStatusLabels: Record<string, string> = {
  ACTIVE: 'Aktiv',
  MAINTENANCE: 'Texniki Xidmət',
  IDLE: 'Boş',
  BROKEN: 'Sıradan Çıxmış',
}

export const runStatusLabels: Record<string, string> = {
  PENDING: 'Gözləyir',
  IN_PROGRESS: 'Davam Edir',
  COMPLETED: 'Tamamlandı',
  ABORTED: 'Dayandırıldı',
}

export const orderStatusLabels: Record<string, string> = {
  PENDING: 'Gözləyir',
  CONFIRMED: 'Təsdiqləndi',
  IN_PRODUCTION: 'İstehsaldadır',
  READY: 'Hazırdır',
  DELIVERED: 'Çatdırıldı',
  CANCELLED: 'Ləğv Edildi',
}

export const priorityLabels: Record<string, string> = {
  LOW: 'Aşağı',
  NORMAL: 'Normal',
  HIGH: 'Yüksək',
  URGENT: 'Təcili',
}

export const shiftTypeLabels: Record<string, string> = {
  MORNING: 'Səhər (06:00-14:00)',
  EVENING: 'Axşam (14:00-22:00)',
  NIGHT: 'Gecə (22:00-06:00)',
}

export const qualityGradeLabels: Record<string, string> = {
  A: 'A - Premium',
  B: 'B - Standart',
  C: 'C - Qüsurlu',
}

export const recyclingInputLabels: Record<string, string> = {
  PRODUCTION_WASTE: 'İstehsal Tullantısı',
  CUSTOMER_RETURN: 'Müştəri Geri Qaytarması',
  DEFECTIVE_BAGS: 'Qüsurlu Məhsullar',
  TRIM_WASTE: 'Kəsmə Tullantısı',
}
