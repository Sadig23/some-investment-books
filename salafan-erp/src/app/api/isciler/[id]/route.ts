import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      phone: true,
      position: true,
      createdAt: true,
      updatedAt: true,
      shifts: {
        orderBy: { date: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          productionRuns: true,
          printJobs: true,
          cuttingJobs: true,
          recyclingBatches: true,
        },
      },
    },
  })

  if (!user) return NextResponse.json({ error: 'İşçi tapılmadı' }, { status: 404 })

  return NextResponse.json(user)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, position, phone, role, isActive } = body

  const isSelf = session.user.id === params.id

  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name
  if (position !== undefined) updateData.position = position
  if (phone !== undefined) updateData.phone = phone
  // Prevent admin from changing their own role or deactivating themselves
  if (role !== undefined && !isSelf) updateData.role = role
  if (isActive !== undefined && !isSelf) updateData.isActive = isActive

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      phone: true,
      position: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(user)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (session.user.id === params.id) {
    return NextResponse.json({ error: 'Özünüzü silə bilməzsiniz' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: params.id },
    data: { isActive: false },
  })

  return NextResponse.json({ success: true })
}
