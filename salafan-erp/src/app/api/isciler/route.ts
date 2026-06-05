import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const role = req.nextUrl.searchParams.get('role') ?? ''

  const users = await prisma.user.findMany({
    where: role ? { role } : undefined,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      phone: true,
      position: true,
      createdAt: true,
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

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, email, password, role = 'WORKER', position, phone } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Ad, email və şifrə tələb olunur' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Bu email artıq istifadə olunur' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      position: position || null,
      phone: phone || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      phone: true,
      position: true,
      createdAt: true,
    },
  })

  return NextResponse.json(user, { status: 201 })
}
