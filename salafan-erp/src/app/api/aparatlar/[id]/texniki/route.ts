import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const log = await prisma.maintenanceLog.create({ data: { machineId: params.id, ...body } })
  if (body.status === 'IN_PROGRESS') {
    await prisma.machine.update({ where: { id: params.id }, data: { status: 'MAINTENANCE' } })
  } else if (body.status === 'COMPLETED') {
    await prisma.machine.update({ where: { id: params.id }, data: { status: 'ACTIVE' } })
  }
  return NextResponse.json(log, { status: 201 })
}
