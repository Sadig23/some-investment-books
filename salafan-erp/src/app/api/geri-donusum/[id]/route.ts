import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { status, outputWeightKg } = body

  const updated = await prisma.$transaction(async (tx) => {
    const batch = await tx.recyclingBatch.update({
      where: { id: params.id },
      data: {
        status,
        outputWeightKg: outputWeightKg ? parseFloat(outputWeightKg) : undefined,
        efficiency: outputWeightKg ? (parseFloat(outputWeightKg) / (await tx.recyclingBatch.findUnique({ where: { id: params.id }, select: { inputWeightKg: true } }))!.inputWeightKg) * 100 : undefined,
        endTime: status === 'COMPLETED' ? new Date() : undefined,
        startTime: status === 'IN_PROGRESS' ? new Date() : undefined,
      },
    })
    if (status === 'COMPLETED' && outputWeightKg && batch.outputMaterialId) {
      await tx.rawMaterial.update({
        where: { id: batch.outputMaterialId },
        data: { currentStock: { increment: parseFloat(outputWeightKg) } },
      })
    }
    return batch
  })
  return NextResponse.json(updated)
}
