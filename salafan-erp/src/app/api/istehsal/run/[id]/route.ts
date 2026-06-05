import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { status, actualQtyKg, wasteKg, qualityGrade } = body

  const updated = await prisma.$transaction(async (tx) => {
    const run = await tx.productionRun.update({
      where: { id: params.id },
      data: {
        status,
        actualQtyKg: actualQtyKg ? parseFloat(actualQtyKg) : undefined,
        wasteKg: wasteKg ? parseFloat(wasteKg) : undefined,
        qualityGrade,
        endTime: status === 'COMPLETED' ? new Date() : undefined,
        startTime: status === 'IN_PROGRESS' ? new Date() : undefined,
      },
    })

    // If completed, create a film roll and deduct raw materials
    if (status === 'COMPLETED' && actualQtyKg) {
      await tx.filmRoll.create({
        data: {
          rollNumber: generateOrderNumber('RULON'),
          productionRunId: params.id,
          weightKg: parseFloat(actualQtyKg),
          widthMm: run.filmWidthMm ?? 600,
          thicknessMicron: run.filmThicknessMicron,
          status: 'AVAILABLE',
        },
      })

      // Deduct raw materials from stock
      const usages = await tx.productionRawUsage.findMany({ where: { productionRunId: params.id } })
      for (const usage of usages) {
        const qty = usage.actualQty ?? usage.plannedQty
        await tx.rawMaterial.update({
          where: { id: usage.rawMaterialId },
          data: { currentStock: { decrement: qty } },
        })
        await tx.stockAdjustment.create({
          data: {
            rawMaterialId: usage.rawMaterialId,
            adjustmentType: 'PRODUCTION_USE',
            quantity: -qty,
            reason: `İstehsal run: ${run.runNumber}`,
            previousStock: 0,
            newStock: 0,
          },
        })
      }
    }
    return run
  })

  return NextResponse.json(updated)
}
