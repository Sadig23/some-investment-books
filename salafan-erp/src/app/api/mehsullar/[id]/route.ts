import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      costRecipes: {
        include: {
          ingredients: {
            include: { rawMaterial: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      costCalculations: {
        orderBy: { calculationDate: 'desc' },
        take: 5,
      },
    },
  })

  if (!product) return NextResponse.json({ error: 'Tapılmadı' }, { status: 404 })

  return NextResponse.json(product)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      name: body.name,
      code: body.code,
      type: body.type,
      unit: body.unit,
      widthMm: body.widthMm !== undefined ? (body.widthMm ? parseFloat(body.widthMm) : null) : undefined,
      lengthMm: body.lengthMm !== undefined ? (body.lengthMm ? parseFloat(body.lengthMm) : null) : undefined,
      thicknessMicron: body.thicknessMicron !== undefined ? (body.thicknessMicron ? parseFloat(body.thicknessMicron) : null) : undefined,
      weightGram: body.weightGram !== undefined ? (body.weightGram ? parseFloat(body.weightGram) : null) : undefined,
      colorSpec: body.colorSpec !== undefined ? body.colorSpec : undefined,
      description: body.description !== undefined ? body.description : undefined,
    },
  })

  return NextResponse.json(product)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.product.update({
    where: { id: params.id },
    data: { isActive: false },
  })

  return NextResponse.json({ success: true })
}
