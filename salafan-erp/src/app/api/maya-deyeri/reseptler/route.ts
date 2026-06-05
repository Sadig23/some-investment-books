import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const productId = req.nextUrl.searchParams.get('productId')

  const recipes = await prisma.costRecipe.findMany({
    where: productId ? { productId } : undefined,
    include: {
      product: { select: { id: true, name: true, code: true } },
      _count: { select: { ingredients: true } },
    },
    orderBy: [{ productId: 'asc' }, { isDefault: 'desc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json(recipes)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  if (body.isDefault) {
    await prisma.costRecipe.updateMany({
      where: { productId: body.productId },
      data: { isDefault: false },
    })
  }

  const recipe = await prisma.costRecipe.create({
    data: {
      productId: body.productId,
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

  return NextResponse.json(recipe, { status: 201 })
}
