-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'WORKER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "phone" TEXT,
    "position" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "raw_materials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "currentStock" REAL NOT NULL DEFAULT 0,
    "minStockLevel" REAL NOT NULL DEFAULT 100,
    "unitCost" REAL NOT NULL DEFAULT 0,
    "supplier" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rawMaterialId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitCost" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "supplier" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "purchaseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchases_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "raw_materials" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rawMaterialId" TEXT NOT NULL,
    "adjustmentType" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "previousStock" REAL NOT NULL,
    "newStock" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_adjustments_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "raw_materials" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "powerKw" REAL NOT NULL,
    "capacityKgHr" REAL,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "installDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "location" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "maintenance_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "machineId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "cost" REAL,
    "downtimeHours" REAL,
    "scheduledDate" DATETIME,
    "completedDate" DATETIME,
    "nextServiceDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "maintenance_logs_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "taxId" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'ədəd',
    "widthMm" REAL,
    "lengthMm" REAL,
    "thicknessMicron" REAL,
    "weightGram" REAL,
    "colorSpec" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "customer_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "deliveredDate" DATETIME,
    "totalAmount" REAL,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "customer_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customer_order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "deliveredQty" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "customer_order_items_customerOrderId_fkey" FOREIGN KEY ("customerOrderId") REFERENCES "customer_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "customer_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "production_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerOrderId" TEXT,
    "plannedQty" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "plannedStartDate" DATETIME,
    "plannedEndDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "production_orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "production_orders_customerOrderId_fkey" FOREIGN KEY ("customerOrderId") REFERENCES "customer_orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "production_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runNumber" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "plannedQtyKg" REAL NOT NULL,
    "actualQtyKg" REAL,
    "wasteKg" REAL NOT NULL DEFAULT 0,
    "filmThicknessMicron" REAL,
    "filmWidthMm" REAL,
    "speedMPerMin" REAL,
    "temperatureC" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "qualityGrade" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "production_runs_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "production_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "production_runs_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "production_runs_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "production_raw_usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productionRunId" TEXT NOT NULL,
    "rawMaterialId" TEXT NOT NULL,
    "plannedQty" REAL NOT NULL,
    "actualQty" REAL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "production_raw_usage_productionRunId_fkey" FOREIGN KEY ("productionRunId") REFERENCES "production_runs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "production_raw_usage_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "raw_materials" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "film_rolls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rollNumber" TEXT NOT NULL,
    "productionRunId" TEXT NOT NULL,
    "weightKg" REAL NOT NULL,
    "widthMm" REAL NOT NULL,
    "lengthM" REAL,
    "thicknessMicron" REAL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "location" TEXT,
    "qrCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "film_rolls_productionRunId_fkey" FOREIGN KEY ("productionRunId") REFERENCES "production_runs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quality_checks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productionRunId" TEXT NOT NULL,
    "checkerId" TEXT NOT NULL,
    "filmThickness" REAL,
    "hasDefects" BOOLEAN NOT NULL DEFAULT false,
    "defectType" TEXT,
    "grade" TEXT,
    "notes" TEXT,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quality_checks_productionRunId_fkey" FOREIGN KEY ("productionRunId") REFERENCES "production_runs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "quality_checks_checkerId_fkey" FOREIGN KEY ("checkerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recycling_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchNumber" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "inputType" TEXT NOT NULL,
    "inputWeightKg" REAL NOT NULL,
    "outputWeightKg" REAL,
    "outputMaterialId" TEXT,
    "efficiency" REAL,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "recycling_batches_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "recycling_batches_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "recycling_batches_outputMaterialId_fkey" FOREIGN KEY ("outputMaterialId") REFERENCES "raw_materials" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "print_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobNumber" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "designName" TEXT NOT NULL,
    "designFile" TEXT,
    "colorCount" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startTime" DATETIME,
    "endTime" DATETIME,
    "totalLengthM" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "print_jobs_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "print_jobs_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "print_job_rolls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "printJobId" TEXT NOT NULL,
    "filmRollId" TEXT NOT NULL,
    CONSTRAINT "print_job_rolls_printJobId_fkey" FOREIGN KEY ("printJobId") REFERENCES "print_jobs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "print_job_rolls_filmRollId_fkey" FOREIGN KEY ("filmRollId") REFERENCES "film_rolls" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "print_ink_usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "printJobId" TEXT NOT NULL,
    "rawMaterialId" TEXT NOT NULL,
    "quantityKg" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "print_ink_usage_printJobId_fkey" FOREIGN KEY ("printJobId") REFERENCES "print_jobs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "print_ink_usage_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "raw_materials" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cutting_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobNumber" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "bagWidthMm" REAL,
    "bagLengthMm" REAL,
    "outputQty" REAL,
    "wasteKg" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startTime" DATETIME,
    "endTime" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cutting_jobs_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cutting_jobs_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cutting_job_rolls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cuttingJobId" TEXT NOT NULL,
    "filmRollId" TEXT NOT NULL,
    CONSTRAINT "cutting_job_rolls_cuttingJobId_fkey" FOREIGN KEY ("cuttingJobId") REFERENCES "cutting_jobs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cutting_job_rolls_filmRollId_fkey" FOREIGN KEY ("filmRollId") REFERENCES "film_rolls" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cost_recipes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "energyKwhPerKg" REAL NOT NULL DEFAULT 0,
    "laborCostPerKg" REAL NOT NULL DEFAULT 0,
    "overheadPerKg" REAL NOT NULL DEFAULT 0,
    "wasteFactor" REAL NOT NULL DEFAULT 0.05,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cost_recipes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cost_recipe_ingredients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "costRecipeId" TEXT NOT NULL,
    "rawMaterialId" TEXT NOT NULL,
    "qtyPerKg" REAL NOT NULL,
    CONSTRAINT "cost_recipe_ingredients_costRecipeId_fkey" FOREIGN KEY ("costRecipeId") REFERENCES "cost_recipes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cost_recipe_ingredients_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "raw_materials" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cost_calculations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "costRecipeId" TEXT,
    "calculationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantityKg" REAL NOT NULL,
    "rawMaterialCost" REAL NOT NULL,
    "energyCost" REAL NOT NULL,
    "laborCost" REAL NOT NULL,
    "overheadCost" REAL NOT NULL,
    "wasteCost" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "costPerKg" REAL NOT NULL,
    "costPerUnit" REAL,
    "energyPricePerKwh" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cost_calculations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "shiftType" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "hoursWorked" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shifts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "customerOrderId" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "invoices_customerOrderId_fkey" FOREIGN KEY ("customerOrderId") REFERENCES "customer_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldData" TEXT,
    "newData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "raw_materials_code_key" ON "raw_materials"("code");

-- CreateIndex
CREATE UNIQUE INDEX "machines_code_key" ON "machines"("code");

-- CreateIndex
CREATE UNIQUE INDEX "customers_code_key" ON "customers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "customer_orders_orderNumber_key" ON "customer_orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "production_orders_orderNumber_key" ON "production_orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "production_runs_runNumber_key" ON "production_runs"("runNumber");

-- CreateIndex
CREATE UNIQUE INDEX "film_rolls_rollNumber_key" ON "film_rolls"("rollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "recycling_batches_batchNumber_key" ON "recycling_batches"("batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "print_jobs_jobNumber_key" ON "print_jobs"("jobNumber");

-- CreateIndex
CREATE UNIQUE INDEX "print_job_rolls_printJobId_filmRollId_key" ON "print_job_rolls"("printJobId", "filmRollId");

-- CreateIndex
CREATE UNIQUE INDEX "cutting_jobs_jobNumber_key" ON "cutting_jobs"("jobNumber");

-- CreateIndex
CREATE UNIQUE INDEX "cutting_job_rolls_cuttingJobId_filmRollId_key" ON "cutting_job_rolls"("cuttingJobId", "filmRollId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");
