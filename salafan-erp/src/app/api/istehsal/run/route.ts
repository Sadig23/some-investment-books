import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const where: any = {}
  if (session.user.role === 'WORKER') where.operatorId = session.user.id
  const status = req.nextUrl.searchParams.get('status')
  if (status) where.status = status

  const runs = await prisma.productionRun.findMany({
    where,
    include: {
      productionOrder: { include: { product: { select: { name: true } } } },
      machine: { select: { name: true } },
      operator: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json(runs)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { productionOrderId, machineId, plannedQtyKg, rawMaterials, ...rest } = body

  const run = await prisma.$transaction(async (tx) => {
    const r = await tx.productionRun.create({
      data: {
        runNumber: generateOrderNumber('RUN'),
        productionOrderId,
        machineId,
        operatorId: session.user.id,
        plannedQtyKg: parseFloat(plannedQtyKg),
        status: 'PENDING',
        ...rest,
      },
    })
    if (rawMaterials?.length) {
      await tx.productionRawUsage.createMany({
        data: rawMaterials.map((rm: any) => ({
          productionRunId: r.id,
          rawMaterialId: rm.rawMaterialId,
          plannedQty: parseFloat(rm.qty),
        })),
      })
    }
    await tx.productionOrder.update({
      where: { id: productionOrderId },
      data: { status: 'IN_PROGRESS' },
    })
    return r
  })

  return NextResponse.json(run, { status: 201 })
}
