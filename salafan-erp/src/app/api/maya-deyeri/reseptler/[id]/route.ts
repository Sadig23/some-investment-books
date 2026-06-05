import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const recipe = await prisma.costRecipe.findUnique({
    where: { id: params.id },
    include: {
      product: { select: { id: true, name: true, code: true } },
      ingredients: {
        include: {
          rawMaterial: { select: { id: true, name: true, unit: true, unitCost: true } },
        },
      },
    },
  })

  if (!recipe) return NextResponse.json({ error: 'Tapılmadı' }, { status: 404 })

  return NextResponse.json(recipe)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  if (body.isDefault) {
    const existing = await prisma.costRecipe.findUnique({ where: { id: params.id } })
    if (existing) {
      await prisma.costRecipe.updateMany({
        where: { productId: existing.productId, id: { not: params.id } },
        data: { isDefault: false },
      })
    }
  }

  await prisma.costRecipeIngredient.deleteMany({ where: { costRecipeId: params.id } })

  const recipe = await prisma.costRecipe.update({
    where: { id: params.id },
    data: {
      name: body.name,
      isDefault: body.isDefault ?? false,
      energyKwhPerKg: parseFloat(body.energyKwhPerKg ?? 0),
      laborCostPerKg: parseFloat(body.laborCostPerKg ?? 0),
      overheadPerKg: parseFloat(body.overheadPerKg ?? 0),
      wasteFactor: parseFloat(body.wasteFactor ?? 0.05),
      ingredients: {
        create: (body.ingredients ?? []).map((ing: { rawMaterialId: string; qtyPerKg: number }) => ({
          rawMaterialId: ing.rawMaterialId,
          qtyPerKg: parseFloat(String(ing.qtyPerKg)),
        })),
      },
    },
    include: {
      ingredients: { include: { rawMaterial: true } },
      product: true,
    },
  })

  return NextResponse.json(recipe)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.costRecipe.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
