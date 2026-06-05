import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const type = req.nextUrl.searchParams.get('type') ?? 'istehsal'
  const fromParam = req.nextUrl.searchParams.get('from')
  const toParam = req.nextUrl.searchParams.get('to')

  const now = new Date()
  const defaultFrom = new Date(now)
  defaultFrom.setDate(defaultFrom.getDate() - 30)

  const from = fromParam ? new Date(fromParam) : defaultFrom
  const to = toParam ? new Date(toParam + 'T23:59:59') : new Date(now.toDateString() + ' 23:59:59')

  const wb = XLSX.utils.book_new()
  let sheetName = 'Hesabat'

  if (type === 'istehsal') {
    const runs = await prisma.productionRun.findMany({
      where: { endTime: { gte: from, lte: to } },
      include: {
        machine: { select: { name: true, code: true } },
        operator: { select: { name: true } },
        productionOrder: { select: { orderNumber: true } },
      },
      orderBy: { startTime: 'desc' },
    })

    const data = runs.map((r) => ({
      'Run №': r.runNumber,
      'Sifariş №': r.productionOrder.orderNumber,
      'Aparat': r.machine.name,
      'Operator': r.operator.name,
      'Başlama': r.startTime ? r.startTime.toISOString().replace('T', ' ').split('.')[0] : '',
      'Bitmə': r.endTime ? r.endTime.toISOString().replace('T', ' ').split('.')[0] : '',
      'Plan (kg)': r.plannedQtyKg,
      'Faktiki (kg)': r.actualQtyKg ?? 0,
      'Tullantı (kg)': r.wasteKg,
      'Status': r.status,
      'Keyfiyyət': r.qualityGrade ?? '',
      'Qeyd': r.notes ?? '',
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, 'İstehsal Runları')
    sheetName = 'istehsal'
  } else if (type === 'xamal') {
    const materials = await prisma.rawMaterial.findMany({
      orderBy: { name: 'asc' },
    })

    const data = materials.map((m) => ({
      'Ad': m.name,
      'Kod': m.code,
      'Növ': m.type,
      'Vahid': m.unit,
      'Cari Stok': m.currentStock,
      'Min Stok': m.minStockLevel,
      'Vahid Qiymət (AZN)': m.unitCost,
      'Stok Dəyəri (AZN)': Math.round(m.currentStock * m.unitCost * 100) / 100,
      'Aşağı Stok': m.currentStock <= m.minStockLevel ? 'Bəli' : 'Xeyr',
      'Təchizatçı': m.supplier ?? '',
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, 'Xamal')
    sheetName = 'xamal'
  } else if (type === 'maliyye') {
    const orders = await prisma.customerOrder.findMany({
      where: { orderDate: { gte: from, lte: to } },
      include: {
        customer: { select: { name: true, code: true } },
      },
      orderBy: { orderDate: 'desc' },
    })

    const data = orders.map((o) => ({
      'Sifariş №': o.orderNumber,
      'Müştəri': o.customer.name,
      'Müştəri Kodu': o.customer.code,
      'Status': o.status,
      'Sifariş Tarixi': o.orderDate.toISOString().split('T')[0],
      'Son Tarix': o.dueDate ? o.dueDate.toISOString().split('T')[0] : '',
      'Çatdırılma Tarixi': o.deliveredDate ? o.deliveredDate.toISOString().split('T')[0] : '',
      'Cəmi Məbləğ (AZN)': o.totalAmount ?? 0,
      'Ödənilmiş (AZN)': o.paidAmount,
      'Borc (AZN)': Math.round(((o.totalAmount ?? 0) - o.paidAmount) * 100) / 100,
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, 'Sifarişlər')
    sheetName = 'maliyye'
  }

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="hesabat-${sheetName}-${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  })
}
