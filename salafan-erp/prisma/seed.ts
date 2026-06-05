import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seed başlayır...')

  // System Settings
  const settings = [
    { key: 'energy_price_kwh', value: '0.12' },
    { key: 'labor_rate_hour', value: '2.50' },
    { key: 'company_name', value: 'Salafan MMC' },
    { key: 'company_phone', value: '+994 12 345 67 89' },
    { key: 'company_address', value: 'Bakı, Azərbaycan' },
    { key: 'default_margin_percent', value: '25' },
  ]
  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    })
  }

  // Admin user
  const adminPass = await bcrypt.hash('Admin@123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@salafan.az' },
    update: {},
    create: {
      name: 'Admin İstifadəçi',
      email: 'admin@salafan.az',
      password: adminPass,
      role: "ADMIN",
      position: 'Sistem Administratoru',
      phone: '+994 50 123 45 67',
    },
  })

  // Worker users
  const workerPass = await bcrypt.hash('Worker@123', 12)
  const worker1 = await prisma.user.upsert({
    where: { email: 'operator1@salafan.az' },
    update: {},
    create: {
      name: 'Əli Həsənov',
      email: 'operator1@salafan.az',
      password: workerPass,
      role: "WORKER",
      position: 'Ekstruziya Operatoru',
      phone: '+994 55 234 56 78',
    },
  })
  const worker2 = await prisma.user.upsert({
    where: { email: 'operator2@salafan.az' },
    update: {},
    create: {
      name: 'Vüsal Quliyev',
      email: 'operator2@salafan.az',
      password: workerPass,
      role: "WORKER",
      position: 'Çap Operatoru',
      phone: '+994 70 345 67 89',
    },
  })

  // Raw Materials
  const ldpe = await prisma.rawMaterial.upsert({
    where: { code: 'LDPE-001' },
    update: {},
    create: {
      name: 'LDPE Qranul',
      code: 'LDPE-001',
      type: "LDPE_GRANULE",
      unit: 'kg',
      currentStock: 5000,
      minStockLevel: 500,
      unitCost: 2.50,
      supplier: 'Kimya Sənaye MMC',
    },
  })
  const hdpe = await prisma.rawMaterial.upsert({
    where: { code: 'HDPE-001' },
    update: {},
    create: {
      name: 'HDPE Qranul',
      code: 'HDPE-001',
      type: "HDPE_GRANULE",
      unit: 'kg',
      currentStock: 3000,
      minStockLevel: 300,
      unitCost: 2.80,
      supplier: 'Kimya Sənaye MMC',
    },
  })
  const pigment1 = await prisma.rawMaterial.upsert({
    where: { code: 'PIG-001' },
    update: {},
    create: {
      name: 'Ağ Piqment (TiO2)',
      code: 'PIG-001',
      type: "PIGMENT",
      unit: 'kg',
      currentStock: 500,
      minStockLevel: 50,
      unitCost: 8.00,
      supplier: 'Rəng Zavodu',
    },
  })
  const pigment2 = await prisma.rawMaterial.upsert({
    where: { code: 'PIG-002' },
    update: {},
    create: {
      name: 'Qara Piqment (Carbon Black)',
      code: 'PIG-002',
      type: "PIGMENT",
      unit: 'kg',
      currentStock: 200,
      minStockLevel: 30,
      unitCost: 6.50,
      supplier: 'Rəng Zavodu',
    },
  })
  const ink1 = await prisma.rawMaterial.upsert({
    where: { code: 'INK-001' },
    update: {},
    create: {
      name: 'Çap Mürəkkəbi (Qırmızı)',
      code: 'INK-001',
      type: "INK",
      unit: 'kg',
      currentStock: 100,
      minStockLevel: 20,
      unitCost: 15.00,
      supplier: 'Çap Malları ASC',
    },
  })
  const recycledMat = await prisma.rawMaterial.upsert({
    where: { code: 'REC-001' },
    update: {},
    create: {
      name: 'Geri Dönüşüm Qranulu',
      code: 'REC-001',
      type: "RECYCLED_GRANULE",
      unit: 'kg',
      currentStock: 800,
      minStockLevel: 100,
      unitCost: 1.20,
      supplier: 'Daxili İstehsal',
    },
  })

  // Machines
  const ext1 = await prisma.machine.upsert({
    where: { code: 'EXT-001' },
    update: {},
    create: {
      name: 'Ekstruziya #1',
      code: 'EXT-001',
      type: "EXTRUSION",
      powerKw: 45,
      capacityKgHr: 60,
      manufacturer: 'Plastics Machinery Co.',
      status: "ACTIVE",
      location: 'A Seksiya',
    },
  })
  const ext2 = await prisma.machine.upsert({
    where: { code: 'EXT-002' },
    update: {},
    create: {
      name: 'Ekstruziya #2',
      code: 'EXT-002',
      type: "EXTRUSION",
      powerKw: 55,
      capacityKgHr: 75,
      manufacturer: 'Plastics Machinery Co.',
      status: "ACTIVE",
      location: 'A Seksiya',
    },
  })
  const printer1 = await prisma.machine.upsert({
    where: { code: 'CAP-001' },
    update: {},
    create: {
      name: 'Çap Aparatı #1',
      code: 'CAP-001',
      type: "PRINTING",
      powerKw: 22,
      capacityKgHr: 40,
      manufacturer: 'FlexoPrint GmbH',
      status: "ACTIVE",
      location: 'B Seksiya',
    },
  })
  const cutter1 = await prisma.machine.upsert({
    where: { code: 'KES-001' },
    update: {},
    create: {
      name: 'Kəsmə Aparatı #1',
      code: 'KES-001',
      type: "CUTTING",
      powerKw: 15,
      capacityKgHr: 80,
      manufacturer: 'CutTech Ltd.',
      status: "ACTIVE",
      location: 'C Seksiya',
    },
  })
  const recycler1 = await prisma.machine.upsert({
    where: { code: 'GD-001' },
    update: {},
    create: {
      name: 'Geri Dönüşüm Aparatı #1',
      code: 'GD-001',
      type: "RECYCLING",
      powerKw: 30,
      capacityKgHr: 50,
      status: "ACTIVE",
      location: 'D Seksiya',
    },
  })

  // Products
  const prod1 = await prisma.product.upsert({
    where: { code: 'PRD-001' },
    update: {},
    create: {
      name: 'Polietilen Film Rulosu 50mkm',
      code: 'PRD-001',
      type: "FILM_ROLL",
      unit: 'kg',
      thicknessMicron: 50,
      widthMm: 600,
      description: 'Standart polietilen film rulosu',
    },
  })
  const prod2 = await prisma.product.upsert({
    where: { code: 'PRD-002' },
    update: {},
    create: {
      name: 'Polietilen Torba 30x40',
      code: 'PRD-002',
      type: "BAG_PLAIN",
      unit: 'ədəd',
      widthMm: 300,
      lengthMm: 400,
      thicknessMicron: 25,
      weightGram: 12,
      description: 'Sadə polietilen torba',
    },
  })
  const prod3 = await prisma.product.upsert({
    where: { code: 'PRD-003' },
    update: {},
    create: {
      name: 'Çaplı Polietilen Torba 35x50',
      code: 'PRD-003',
      type: "BAG_PRINTED",
      unit: 'ədəd',
      widthMm: 350,
      lengthMm: 500,
      thicknessMicron: 30,
      weightGram: 18,
      colorSpec: 'Rəngli çap',
      description: 'Logolu/çaplı polietilen torba',
    },
  })

  // Customers
  await prisma.customer.upsert({
    where: { code: 'MUS-001' },
    update: {},
    create: {
      name: 'Bakı Market Zənciri MMC',
      code: 'MUS-001',
      contactName: 'Fuad Əliyev',
      phone: '+994 12 567 89 01',
      address: 'Bakı, Nərimanov rayonu',
      taxId: '1234567890',
    },
  })
  await prisma.customer.upsert({
    where: { code: 'MUS-002' },
    update: {},
    create: {
      name: 'Gəncə Supermarket SC',
      code: 'MUS-002',
      contactName: 'Nigar Hüseynova',
      phone: '+994 22 345 67 89',
      address: 'Gəncə şəhəri',
      taxId: '0987654321',
    },
  })

  // Cost Recipes
  const recipe1 = await prisma.costRecipe.create({
    data: {
      productId: prod1.id,
      name: 'Film Rulosu Standart Resept',
      isDefault: true,
      energyKwhPerKg: 0.75,
      laborCostPerKg: 0.30,
      overheadPerKg: 0.20,
      wasteFactor: 0.04,
      ingredients: {
        create: [
          { rawMaterialId: ldpe.id, qtyPerKg: 0.80 },
          { rawMaterialId: hdpe.id, qtyPerKg: 0.15 },
          { rawMaterialId: pigment1.id, qtyPerKg: 0.05 },
        ],
      },
    },
  })
  const recipe2 = await prisma.costRecipe.create({
    data: {
      productId: prod2.id,
      name: 'Torba Standart Resept',
      isDefault: true,
      energyKwhPerKg: 0.85,
      laborCostPerKg: 0.35,
      overheadPerKg: 0.25,
      wasteFactor: 0.05,
      ingredients: {
        create: [
          { rawMaterialId: ldpe.id, qtyPerKg: 0.85 },
          { rawMaterialId: hdpe.id, qtyPerKg: 0.10 },
          { rawMaterialId: pigment1.id, qtyPerKg: 0.05 },
        ],
      },
    },
  })

  console.log('✅ Seed tamamlandı!')
  console.log('─────────────────────────────')
  console.log('Admin: admin@salafan.az / Admin@123')
  console.log('İşçi:  operator1@salafan.az / Worker@123')
  console.log('─────────────────────────────')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
