import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const todayStart = startOfDay(now)
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))

  const [
    todayProduction,
    activeOrders,
    lowStockMaterials,
    activeMachines,
    monthRevenue,
    lastMonthRevenue,
    recyclingBatches,
    recentActivity,
    productionByDay,
    stockLevels,
    machineStatus,
    ordersByStatus,
  ] = await Promise.all([
    // Today's production in kg
    prisma.productionRun.aggregate({
      where: {
        status: 'COMPLETED',
        endTime: { gte: todayStart },
      },
      _sum: { actualQtyKg: true },
    }),
    // Active production orders
    prisma.productionOrder.count({
      where: { status: 'IN_PROGRESS' },
    }),
    // Low stock materials
    prisma.rawMaterial.findMany({
      where: {
        currentStock: { lte: prisma.rawMaterial.fields.minStockLevel },
      },
      select: { id: true, name: true, currentStock: true, minStockLevel: true },
    }),
    // Active machines
    prisma.machine.count({ where: { status: 'ACTIVE' } }),
    // This month revenue
    prisma.customerOrder.aggregate({
      where: {
        status: { in: ['DELIVERED', 'READY'] },
        orderDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { totalAmount: true },
    }),
    // Last month revenue
    prisma.customerOrder.aggregate({
      where: {
        status: { in: ['DELIVERED', 'READY'] },
        orderDate: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      _sum: { totalAmount: true },
    }),
    // Recycling efficiency this month
    prisma.recyclingBatch.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: monthStart },
      },
      select: { inputWeightKg: true, outputWeightKg: true },
    }),
    // Recent production runs
    prisma.productionRun.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        productionOrder: { include: { product: true } },
        machine: { select: { name: true } },
        operator: { select: { name: true } },
      },
    }),
    // Production last 7 days
    prisma.$queryRaw`
      SELECT date(endTime) as day, SUM(actualQtyKg) as total
      FROM production_runs
      WHERE status = 'COMPLETED' AND endTime >= datetime('now', '-7 days')
      GROUP BY date(endTime)
      ORDER BY day
    `,
    // Top 5 materials by stock %
    prisma.rawMaterial.findMany({
      take: 6,
      orderBy: { currentStock: 'asc' },
      select: { id: true, name: true, currentStock: true, minStockLevel: true, unit: true },
    }),
    // Machines by status
    prisma.machine.groupBy({
      by: ['status'],
      _count: true,
    }),
    // Orders by status
    prisma.customerOrder.groupBy({
      by: ['status'],
      _count: true,
    }),
  ])

  // Calculate recycling efficiency
  const totalInput = recyclingBatches.reduce((s, b) => s + b.inputWeightKg, 0)
  const totalOutput = recyclingBatches.reduce((s, b) => s + (b.outputWeightKg ?? 0), 0)
  const recyclingEfficiency = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0

  // Low stock - proper query
  const lowStock = await prisma.$queryRaw`
    SELECT id, name, currentStock, minStockLevel, unit
    FROM raw_materials
    WHERE currentStock <= minStockLevel
    LIMIT 5
  ` as any[]

  return NextResponse.json({
    todayProduction: todayProduction._sum.actualQtyKg ?? 0,
    activeOrders,
    lowStockCount: lowStock.length,
    activeMachines,
    monthRevenue: monthRevenue._sum.totalAmount ?? 0,
    lastMonthRevenue: lastMonthRevenue._sum.totalAmount ?? 0,
    recyclingEfficiency: Math.round(recyclingEfficiency),
    recentActivity,
    productionByDay,
    lowStock,
    machineStatus,
    ordersByStatus,
  })
}
