import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const productId = req.nextUrl.searchParams.get('productId')
  const limitParam = req.nextUrl.searchParams.get('limit')
  const limit = limitParam ? parseInt(limitParam) : 50

  const calculations = await prisma.costCalculation.findMany({
    where: productId ? { productId } : undefined,
    include: {
      product: { select: { id: true, name: true, code: true } },
    },
    orderBy: { calculationDate: 'desc' },
    take: limit,
  })

  return NextResponse.json(calculations)
}
