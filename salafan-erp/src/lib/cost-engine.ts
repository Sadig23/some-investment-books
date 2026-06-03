import { prisma } from '@/lib/prisma'

export interface CostInput {
  productId: string
  recipeId: string
  quantityKg: number
  energyPricePerKwh?: number
  laborRatePerHour?: number
}

export interface CostBreakdown {
  rawMaterialCost: number
  energyCost: number
  laborCost: number
  overheadCost: number
  wasteCost: number
  totalCost: number
  costPerKg: number
  costPerUnit: number | null
  ingredientBreakdown: Array<{
    name: string
    qtyPerKg: number
    unitCost: number
    totalCost: number
  }>
}

export async function calculateCost(input: CostInput): Promise<CostBreakdown> {
  const recipe = await prisma.costRecipe.findUnique({
    where: { id: input.recipeId },
    include: {
      ingredients: {
        include: { rawMaterial: true },
      },
      product: true,
    },
  })

  if (!recipe) throw new Error('Resept tapılmadı')

  const energySetting = await prisma.systemSetting.findUnique({
    where: { key: 'energy_price_kwh' },
  })
  const energyPrice = input.energyPricePerKwh ??
    parseFloat(energySetting?.value ?? '0.12')

  // Calculate raw material cost
  const ingredientBreakdown = recipe.ingredients.map((ing) => {
    const totalCost = ing.qtyPerKg * ing.rawMaterial.unitCost * input.quantityKg
    return {
      name: ing.rawMaterial.name,
      qtyPerKg: ing.qtyPerKg,
      unitCost: ing.rawMaterial.unitCost,
      totalCost,
    }
  })

  const rawMaterialCost = ingredientBreakdown.reduce((sum, i) => sum + i.totalCost, 0)
  const energyCost = recipe.energyKwhPerKg * energyPrice * input.quantityKg
  const laborCost = recipe.laborCostPerKg * input.quantityKg
  const overheadCost = recipe.overheadPerKg * input.quantityKg
  const wasteCost = rawMaterialCost * recipe.wasteFactor
  const totalCost = rawMaterialCost + energyCost + laborCost + overheadCost + wasteCost
  const costPerKg = input.quantityKg > 0 ? totalCost / input.quantityKg : 0
  const costPerUnit = recipe.product.weightGram
    ? costPerKg * (recipe.product.weightGram / 1000)
    : null

  return {
    rawMaterialCost,
    energyCost,
    laborCost,
    overheadCost,
    wasteCost,
    totalCost,
    costPerKg,
    costPerUnit,
    ingredientBreakdown,
  }
}
