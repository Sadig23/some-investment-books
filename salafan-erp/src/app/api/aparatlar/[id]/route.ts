import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const machine = await prisma.machine.findUnique({
    where: { id: params.id },
    include: {
      maintenanceLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      productionRuns: { orderBy: { createdAt: 'desc' }, take: 5, include: { operator: { select: { name: true } } } },
    },
  })
  if (!machine) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(machine)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const machine = await prisma.machine.update({ where: { id: params.id }, data: body })
  return NextResponse.json(machine)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.machine.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
