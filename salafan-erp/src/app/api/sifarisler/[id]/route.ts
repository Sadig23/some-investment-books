import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const order = await prisma.customerOrder.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      items: {
        include: {
          product: { select: { id: true, name: true, code: true, type: true } },
        },
      },
      productionOrders: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          plannedQty: true,
          unit: true,
          product: { select: { name: true } },
        },
      },
      invoices: {
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

  const updateData: Record<string, unknown> = {}

  if (body.status !== undefined) {
    updateData.status = body.status
    if (body.status === 'COMPLETED') {
      updateData.deliveredDate = body.deliveredDate ? new Date(body.deliveredDate) : new Date()
    }
  }
  if (body.notes !== undefined) updateData.notes = body.notes
  if (body.deliveredDate !== undefined) updateData.deliveredDate = new Date(body.deliveredDate)
  if (body.paidAmount !== undefined) updateData.paidAmount = parseFloat(body.paidAmount)

  const order = await prisma.customerOrder.update({
    where: { id: params.id },
    data: updateData,
    include: {
      customer: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(order)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const order = await prisma.customerOrder.findUnique({
    where: { id: params.id },
    select: { status: true },
  })

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (order.status !== 'PENDING') {
    return NextResponse.json(
      { error: 'Yalnız gözləmədəki sifarişlər silinə bilər.' },
      { status: 400 }
    )
  }

  await prisma.customerOrder.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
