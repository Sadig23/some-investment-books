import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const job = await prisma.cuttingJob.update({
    where: { id: params.id },
    data: {
      status: body.status,
      outputQty: body.outputQty ? parseFloat(body.outputQty) : undefined,
      wasteKg: body.wasteKg ? parseFloat(body.wasteKg) : undefined,
      startTime: body.status === 'IN_PROGRESS' ? new Date() : undefined,
      endTime: body.status === 'COMPLETED' ? new Date() : undefined,
    },
  })
  return NextResponse.json(job)
}
