import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const batches = await prisma.recyclingBatch.findMany({
    include: {
      machine: { select: { name: true } },
      operator: { select: { name: true } },
      outputMaterial: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json(batches)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const batch = await prisma.recyclingBatch.create({
    data: {
      batchNumber: generateOrderNumber('GD'),
      operatorId: session.user.id,
      inputWeightKg: parseFloat(body.inputWeightKg),
      inputType: body.inputType,
      machineId: body.machineId,
      outputMaterialId: body.outputMaterialId || null,
      notes: body.notes,
      status: 'PENDING',
    },
  })
  return NextResponse.json(batch, { status: 201 })
}
