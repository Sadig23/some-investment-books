import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const status = req.nextUrl.searchParams.get('status') ?? ''
  const orders = await prisma.productionOrder.findMany({
    where: { status: status || undefined },
    include: { product: { select: { name: true, unit: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const order = await prisma.productionOrder.create({
    data: { ...body, orderNumber: generateOrderNumber('IST') },
  })
  return NextResponse.json(order, { status: 201 })
}
