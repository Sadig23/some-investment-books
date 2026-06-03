import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const purchases = await prisma.purchase.findMany({
    include: { rawMaterial: { select: { name: true, unit: true } } },
    orderBy: { purchaseDate: 'desc' },
    take: 100,
  })
  return NextResponse.json(purchases)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { rawMaterialId, quantity, unitCost, supplier, invoiceNumber, notes } = body

  const [purchase] = await prisma.$transaction([
    prisma.purchase.create({
      data: {
        rawMaterialId,
        quantity: parseFloat(quantity),
        unitCost: parseFloat(unitCost),
        totalCost: parseFloat(quantity) * parseFloat(unitCost),
        supplier,
        invoiceNumber,
        notes,
      },
    }),
    prisma.rawMaterial.update({
      where: { id: rawMaterialId },
      data: { currentStock: { increment: parseFloat(quantity) }, unitCost: parseFloat(unitCost) },
    }),
  ])

  return NextResponse.json(purchase, { status: 201 })
}
