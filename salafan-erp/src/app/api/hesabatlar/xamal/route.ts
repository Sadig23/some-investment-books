import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const materials = await prisma.rawMaterial.findMany({
    orderBy: { name: 'asc' },
  })

  const recentPurchases = await prisma.purchase.findMany({
    orderBy: { purchaseDate: 'desc' },
    take: 10,
    include: {
      rawMaterial: { select: { name: true, code: true } },
    },
  })

  const totalStockValue = materials.reduce((sum, m) => sum + m.currentStock * m.unitCost, 0)
  const lowStockCount = materials.filter((m) => m.currentStock <= m.minStockLevel).length

  const materialsWithMeta = materials.map((m) => ({
    id: m.id,
    name: m.name,
    code: m.code,
    type: m.type,
    unit: m.unit,
    currentStock: m.currentStock,
    minStockLevel: m.minStockLevel,
    unitCost: m.unitCost,
    stockValue: Math.round(m.currentStock * m.unitCost * 100) / 100,
    isLow: m.currentStock <= m.minStockLevel,
  }))

  // By type
  const typeMap = new Map<string, { type: string; count: number; totalStock: number; totalValue: number }>()
  for (const m of materials) {
    const existing = typeMap.get(m.type)
    if (existing) {
      existing.count += 1
      existing.totalStock += m.currentStock
      existing.totalValue += m.currentStock * m.unitCost
    } else {
      typeMap.set(m.type, {
        type: m.type,
        count: 1,
        totalStock: m.currentStock,
        totalValue: m.currentStock * m.unitCost,
      })
    }
  }
  const byType = Array.from(typeMap.values()).map((t) => ({
    ...t,
    totalStock: Math.round(t.totalStock * 100) / 100,
    totalValue: Math.round(t.totalValue * 100) / 100,
  }))

  return NextResponse.json({
    totalStockValue: Math.round(totalStockValue * 100) / 100,
    lowStockCount,
    materials: materialsWithMeta,
    byType,
    recentPurchases,
  })
}
