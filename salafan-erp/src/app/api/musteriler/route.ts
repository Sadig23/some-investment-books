import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const search = req.nextUrl.searchParams.get('search') ?? ''

  const customers = await prisma.customer.findMany({
    where: {
      isActive: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { contactName: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { orders: true } },
    },
  })

  return NextResponse.json(customers)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  const code = body.code?.trim() || 'MUS-' + Date.now().toString(36).toUpperCase()

  const customer = await prisma.customer.create({
    data: {
      name: body.name,
      code,
      contactName: body.contactName ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      address: body.address ?? null,
      taxId: body.taxId ?? null,
      notes: body.notes ?? null,
    },
  })

  return NextResponse.json(customer, { status: 201 })
}
