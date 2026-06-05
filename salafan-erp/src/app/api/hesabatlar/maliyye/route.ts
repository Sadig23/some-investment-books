import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now = new Date()
  const defaultFrom = new Date(now)
  defaultFrom.setDate(defaultFrom.getDate() - 30)

  const fromParam = req.nextUrl.searchParams.get('from')
  const toParam = req.nextUrl.searchParams.get('to')

  const from = fromParam ? new Date(fromParam) : defaultFrom
  const to = toParam ? new Date(toParam + 'T23:59:59') : new Date(now.toDateString() + ' 23:59:59')

  const orders = await prisma.customerOrder.findMany({
    where: {
      orderDate: { gte: from, lte: to },
    },
    include: {
      customer: { select: { name: true } },
    },
  })

  const totalOrderValue = orders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0)
  const totalPaid = orders.reduce((sum, o) => sum + o.paidAmount, 0)
  const totalPending = totalOrderValue - totalPaid
  const orderCount = orders.length

  // By status
  const statusMap = new Map<string, { status: string; count: number; totalAmount: number }>()
  for (const o of orders) {
    const existing = statusMap.get(o.status)
    if (existing) {
      existing.count += 1
      existing.totalAmount += o.totalAmount ?? 0
    } else {
      statusMap.set(o.status, {
        status: o.status,
        count: 1,
        totalAmount: o.totalAmount ?? 0,
      })
    }
  }
  const ordersByStatus = Array.from(statusMap.values()).map((s) => ({
    ...s,
    totalAmount: Math.round(s.totalAmount * 100) / 100,
  }))

  // Top 5 customers
  const customerMap = new Map<string, { customerName: string; orderCount: number; totalAmount: number }>()
  for (const o of orders) {
    const key = o.customerId
    const existing = customerMap.get(key)
    if (existing) {
      existing.orderCount += 1
      existing.totalAmount += o.totalAmount ?? 0
    } else {
      customerMap.set(key, {
        customerName: o.customer.name,
        orderCount: 1,
        totalAmount: o.totalAmount ?? 0,
      })
    }
  }
  const topCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5)
    .map((c) => ({ ...c, totalAmount: Math.round(c.totalAmount * 100) / 100 }))

  // Monthly revenue last 6 months
  const monthlyMap = new Map<string, { revenue: number; orders: number }>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap.set(key, { revenue: 0, orders: 0 })
  }

  // Fetch all orders from last 6 months for monthly aggregation
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const allRecentOrders = await prisma.customerOrder.findMany({
    where: { orderDate: { gte: sixMonthsAgo } },
    select: { orderDate: true, totalAmount: true },
  })

  for (const o of allRecentOrders) {
    const key = `${o.orderDate.getFullYear()}-${String(o.orderDate.getMonth() + 1).padStart(2, '0')}`
    const existing = monthlyMap.get(key)
    if (existing) {
      existing.revenue += o.totalAmount ?? 0
      existing.orders += 1
    }
  }

  const monthlyRevenue = Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    revenue: Math.round(data.revenue * 100) / 100,
    orders: data.orders,
  }))

  return NextResponse.json({
    totalOrderValue: Math.round(totalOrderValue * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalPending: Math.round(totalPending * 100) / 100,
    orderCount,
    ordersByStatus,
    topCustomers,
    monthlyRevenue,
  })
}
