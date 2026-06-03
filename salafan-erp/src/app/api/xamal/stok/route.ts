import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { rawMaterialId, quantity, reason, adjustmentType } = await req.json()
  const mat = await prisma.rawMaterial.findUnique({ where: { id: rawMaterialId } })
  if (!mat) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const newStock = mat.currentStock + parseFloat(quantity)
  await prisma.$transaction([
    prisma.stockAdjustment.create({
      data: {
        rawMaterialId,
        adjustmentType: adjustmentType ?? 'CORRECTION',
        quantity: parseFloat(quantity),
        reason,
        previousStock: mat.currentStock,
        newStock,
      },
    }),
    prisma.rawMaterial.update({ where: { id: rawMaterialId }, data: { currentStock: newStock } }),
  ])

  return NextResponse.json({ success: true, newStock })
}
