import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = req.nextUrl.searchParams.get('status') ?? ''

  const orders = await prisma.customerOrder.findMany({
    where: {
      status: status && status !== 'ALL' ? status : undefined,
    },
    orderBy: { orderDate: 'desc' },
    include: {
      customer: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
  })

  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  const { customerId, dueDate, notes, items } = body as {
    customerId: string
    dueDate?: string
    notes?: string
    items: Array<{
      productId: string
      quantity: number
      unit: string
      unitPrice: number
    }>
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Ən azı bir məhsul əlavə edin.' }, { status: 400 })
  }

  const orderNumber =
    'SIF-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4)

  const totalAmount = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.customerOrder.create({
      data: {
        orderNumber,
        customerId,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes ?? null,
        totalAmount,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, code: true, type: true, unit: true } },
          },
        },
        customer: { select: { id: true, name: true } },
      },
    })
    return created
  })

  return NextResponse.json(order, { status: 201 })
}
