import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const where: any = {}
  if (session.user.role === 'WORKER') where.operatorId = session.user.id
  const jobs = await prisma.cuttingJob.findMany({
    where,
    include: { machine: { select: { name: true } }, operator: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }, take: 50,
  })
  return NextResponse.json(jobs)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const job = await prisma.cuttingJob.create({
    data: {
      jobNumber: generateOrderNumber('KES'),
      operatorId: session.user.id,
      machineId: body.machineId,
      bagWidthMm: body.bagWidthMm ? parseFloat(body.bagWidthMm) : null,
      bagLengthMm: body.bagLengthMm ? parseFloat(body.bagLengthMm) : null,
      notes: body.notes,
      status: 'PENDING',
    },
  })
  return NextResponse.json(job, { status: 201 })
}
