import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const order = await prisma.productionOrder.findUnique({
    where: { id: params.id },
    include: {
      product: true,
      productionRuns: {
        include: {
          machine: { select: { name: true } },
          operator: { select: { name: true } },
          rawMaterialUsage: { include: { rawMaterial: { select: { name: true, unit: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(order)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const order = await prisma.productionOrder.update({ where: { id: params.id }, data: body })
  return NextResponse.json(order)
}
