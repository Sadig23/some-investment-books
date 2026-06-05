import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      orders: {
        orderBy: { orderDate: 'desc' },
        take: 10,
        include: {
          _count: { select: { items: true } },
        },
      },
    },
  })

  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(customer)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  const customer = await prisma.customer.update({
    where: { id: params.id },
    data: {
      name: body.name,
      code: body.code,
      contactName: body.contactName ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      address: body.address ?? null,
      taxId: body.taxId ?? null,
      notes: body.notes ?? null,
    },
  })

  return NextResponse.json(customer)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Check for active orders
  const activeOrders = await prisma.customerOrder.count({
    where: {
      customerId: params.id,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
  })

  if (activeOrders > 0) {
    return NextResponse.json(
      { error: 'Müştərinin aktiv sifarişləri var. Əvvəlcə sifarişləri tamamlayın.' },
      { status: 400 }
    )
  }

  await prisma.customer.update({
    where: { id: params.id },
    data: { isActive: false },
  })

  return NextResponse.json({ success: true })
}
