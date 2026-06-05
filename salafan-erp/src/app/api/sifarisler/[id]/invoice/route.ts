import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const order = await prisma.customerOrder.findUnique({
    where: { id: params.id },
    select: { id: true, totalAmount: true },
  })

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))

  const invoiceNumber =
    'FAK-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4)

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      customerOrderId: params.id,
      totalAmount: order.totalAmount ?? 0,
      paidAmount: 0,
      status: 'PENDING',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      notes: body.notes ?? null,
    },
  })

  return NextResponse.json(invoice, { status: 201 })
}
