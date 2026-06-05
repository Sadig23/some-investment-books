import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now = new Date()
  const defaultFrom = new Date(now)
  defaultFrom.setDate(defaultFrom.getDate() - 30)

  const fromParam = req.nextUrl.searchParams.get('from')
  const toParam = req.nextUrl.searchParams.get('to')

  const from = fromParam ? new Date(fromParam) : defaultFrom
  const to = toParam ? new Date(toParam + 'T23:59:59') : new Date(now.toDateString() + ' 23:59:59')

  // Fetch completed production runs in range
  const runs = await prisma.productionRun.findMany({
    where: {
      status: 'COMPLETED',
      endTime: { gte: from, lte: to },
    },
    include: {
      machine: { select: { name: true, code: true } },
      operator: { select: { name: true } },
    },
  })

  const totalProduced = runs.reduce((sum, r) => sum + (r.actualQtyKg ?? 0), 0)
  const totalWaste = runs.reduce((sum, r) => sum + r.wasteKg, 0)
  const runCount = runs.length
  const efficiencyPercent =
    totalProduced + totalWaste > 0
      ? Math.round((totalProduced / (totalProduced + totalWaste)) * 100 * 10) / 10
      : 0

  // By machine
  const machineMap = new Map<string, { machineName: string; machinCode: string; totalQty: number; runCount: number }>()
  for (const r of runs) {
    const key = r.machineId
    const existing = machineMap.get(key)
    if (existing) {
      existing.totalQty += r.actualQtyKg ?? 0
      existing.runCount += 1
    } else {
      machineMap.set(key, {
        machineName: r.machine.name,
        machinCode: r.machine.code,
        totalQty: r.actualQtyKg ?? 0,
        runCount: 1,
      })
    }
  }
  const byMachine = Array.from(machineMap.values()).sort((a, b) => b.totalQty - a.totalQty)

  // Daily trend (last 30 days or range)
  const dailyMap = new Map<string, number>()
  for (const r of runs) {
    if (!r.endTime) continue
    const dateStr = r.endTime.toISOString().split('T')[0]
    dailyMap.set(dateStr, (dailyMap.get(dateStr) ?? 0) + (r.actualQtyKg ?? 0))
  }

  // Fill in all dates in range
  const dailyTrend: { date: string; qty: number }[] = []
  const cursor = new Date(from)
  while (cursor <= to) {
    const dateStr = cursor.toISOString().split('T')[0]
    dailyTrend.push({ date: dateStr, qty: Math.round((dailyMap.get(dateStr) ?? 0) * 100) / 100 })
    cursor.setDate(cursor.getDate() + 1)
  }

  // Top operators
  const operatorMap = new Map<string, { operatorName: string; totalQty: number; runCount: number }>()
  for (const r of runs) {
    const key = r.operatorId
    const existing = operatorMap.get(key)
    if (existing) {
      existing.totalQty += r.actualQtyKg ?? 0
      existing.runCount += 1
    } else {
      operatorMap.set(key, {
        operatorName: r.operator.name,
        totalQty: r.actualQtyKg ?? 0,
        runCount: 1,
      })
    }
  }
  const topOperators = Array.from(operatorMap.values())
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, 10)

  return NextResponse.json({
    totalProduced: Math.round(totalProduced * 100) / 100,
    totalWaste: Math.round(totalWaste * 100) / 100,
    efficiencyPercent,
    runCount,
    byMachine,
    dailyTrend,
    topOperators,
  })
}
