import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const type = req.nextUrl.searchParams.get('type') ?? 'ALL'
  const isActiveParam = req.nextUrl.searchParams.get('isActive')

  const products = await prisma.product.findMany({
    where: {
      type: type !== 'ALL' ? type : undefined,
      isActive: isActiveParam !== null ? isActiveParam === 'true' : undefined,
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  const code = body.code?.trim() || 'PRD-' + Date.now().toString(36).toUpperCase()

  const product = await prisma.product.create({
    data: {
      name: body.name,
      code,
      type: body.type,
      unit: body.unit ?? 'ədəd',
      widthMm: body.widthMm ? parseFloat(body.widthMm) : null,
      lengthMm: body.lengthMm ? parseFloat(body.lengthMm) : null,
      thicknessMicron: body.thicknessMicron ? parseFloat(body.thicknessMicron) : null,
      weightGram: body.weightGram ? parseFloat(body.weightGram) : null,
      colorSpec: body.colorSpec ?? null,
      description: body.description ?? null,
    },
  })

  return NextResponse.json(product, { status: 201 })
}
