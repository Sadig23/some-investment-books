import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { newPassword } = body

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: 'Şifrə ən azı 6 simvol olmalıdır' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id: params.id },
    data: { password: hashedPassword },
  })

  return NextResponse.json({ success: true })
}
