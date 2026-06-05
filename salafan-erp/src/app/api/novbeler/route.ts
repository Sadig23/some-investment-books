import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = req.nextUrl.searchParams.get('userId') ?? ''
  const month = req.nextUrl.searchParams.get('month') ?? '' // YYYY-MM

  let dateFilter: { gte?: Date; lte?: Date } | undefined = undefined
  if (month) {
    const [year, mon] = month.split('-').map(Number)
    const start = new Date(year, mon - 1, 1)
    const end = new Date(year, mon, 0, 23, 59, 59, 999)
    dateFilter = { gte: start, lte: end }
  }

  const shifts = await prisma.shift.findMany({
    where: {
      userId: userId || undefined,
      date: dateFilter,
    },
    orderBy: { date: 'desc' },
    include: {
      user: { select: { name: true } },
    },
  })

  return NextResponse.json(shifts)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { userId, shiftType, date, startTime, endTime, notes } = body

  // WORKER can only create shifts for themselves
  if (session.user.role !== 'ADMIN' && session.user.id !== userId) {
    return NextResponse.json({ error: 'Yalnız öz növbənizi əlavə edə bilərsiniz' }, { status: 403 })
  }

  const shiftDate = new Date(date)
  const start = new Date(startTime)
  let end: Date | null = endTime ? new Date(endTime) : null

  let hoursWorked: number | null = null
  if (end) {
    const diffMs = end.getTime() - start.getTime()
    hoursWorked = diffMs / (1000 * 60 * 60)
  }

  const shift = await prisma.shift.create({
    data: {
      userId,
      shiftType,
      date: shiftDate,
      startTime: start,
      endTime: end ?? undefined,
      hoursWorked: hoursWorked ?? undefined,
      notes: notes || null,
    },
    include: {
      user: { select: { name: true } },
    },
  })

  return NextResponse.json(shift, { status: 201 })
}
