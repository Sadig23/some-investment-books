import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const material = await prisma.rawMaterial.findUnique({
    where: { id: params.id },
    include: {
      purchases: { orderBy: { purchaseDate: 'desc' }, take: 20 },
      stockAdjustments: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })
  if (!material) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(material)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const material = await prisma.rawMaterial.update({ where: { id: params.id }, data: body })
  return NextResponse.json(material)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.rawMaterial.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
