import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateCost } from '@/lib/cost-engine'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { productId, recipeId, quantityKg, notes } = body

  if (!productId || !recipeId || !quantityKg) {
    return NextResponse.json({ error: 'productId, recipeId və quantityKg tələb olunur' }, { status: 400 })
  }

  const result = await calculateCost({
    productId,
    recipeId,
    quantityKg: parseFloat(quantityKg),
  })

  const energySetting = await prisma.systemSetting.findUnique({
    where: { key: 'energy_price_kwh' },
  })
  const energyPricePerKwh = parseFloat(energySetting?.value ?? '0.12')

  await prisma.costCalculation.create({
    data: {
      productId,
      costRecipeId: recipeId,
      quantityKg: parseFloat(quantityKg),
      rawMaterialCost: result.rawMaterialCost,
      energyCost: result.energyCost,
      laborCost: result.laborCost,
      overheadCost: result.overheadCost,
      wasteCost: result.wasteCost,
      totalCost: result.totalCost,
      costPerKg: result.costPerKg,
      costPerUnit: result.costPerUnit,
      energyPricePerKwh,
      notes: notes ?? null,
    },
  })

  return NextResponse.json({ ...result, energyPricePerKwh })
}
