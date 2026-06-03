export type UserRole = 'ADMIN' | 'WORKER'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export type RawMaterialType =
  | 'LDPE_GRANULE' | 'HDPE_GRANULE' | 'PIGMENT'
  | 'INK' | 'ADDITIVE' | 'RECYCLED_GRANULE' | 'OTHER'

export type MachineType =
  | 'EXTRUSION' | 'PRINTING' | 'CUTTING'
  | 'RECYCLING' | 'SEALING' | 'OTHER'

export type MachineStatus = 'ACTIVE' | 'MAINTENANCE' | 'IDLE' | 'BROKEN'

export type RunStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED'

export type OrderStatus =
  | 'PENDING' | 'CONFIRMED' | 'IN_PRODUCTION'
  | 'READY' | 'DELIVERED' | 'CANCELLED'

export type ProductionOrderStatus =
  | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export type QualityGrade = 'A' | 'B' | 'C'

export type ShiftType = 'MORNING' | 'EVENING' | 'NIGHT'

export type RecyclingInput =
  | 'PRODUCTION_WASTE' | 'CUSTOMER_RETURN'
  | 'DEFECTIVE_BAGS' | 'TRIM_WASTE'

export interface KpiData {
  todayProduction: number
  activeOrders: number
  lowStockCount: number
  activeMachines: number
  monthlyRevenue: number
  recyclingEfficiency: number
}

export interface CostBreakdown {
  rawMaterialCost: number
  energyCost: number
  laborCost: number
  overheadCost: number
  wasteCost: number
  totalCost: number
  costPerKg: number
  costPerUnit: number | null
}
