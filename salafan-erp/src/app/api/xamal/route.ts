import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const search = req.nextUrl.searchParams.get('search') ?? ''
  const type = req.nextUrl.searchParams.get('type') ?? ''

  const materials = await prisma.rawMaterial.findMany({
    where: {
      name: search ? { contains: search } : undefined,
      type: type || undefined,
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(materials)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const material = await prisma.rawMaterial.create({ data: body })
  return NextResponse.json(material, { status: 201 })
}
