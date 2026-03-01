-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MASTER_ADMIN', 'GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES', 'ACCOUNTANT', 'STAFF');

-- CreateEnum
CREATE TYPE "RateType" AS ENUM ('PERCENTAGE', 'FIXED', 'PER_CC');

-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM ('PASSENGER', 'COMMERCIAL', 'ALL');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('TRANSIT', 'IN_STOCK', 'RESERVED', 'SOLD');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('MANUAL', 'AUTOMATIC', 'SEMI_AUTO');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('REGISTRATION', 'INVOICE', 'CUSTOMS', 'INSPECTION', 'INSURANCE', 'SHIPPING', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('REPAIR', 'PAINT', 'PARTS', 'INSURANCE', 'ADVERTISING', 'OTHER');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('CLEANING', 'SPRAY', 'CLOTH', 'BRUSH', 'CHEMICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TAX_CHANGE', 'CURRENCY_ALERT', 'GENERAL_ANNOUNCEMENT', 'SYSTEM_MAINTENANCE');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('BASIC', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateTable
CREATE TABLE "tax_rates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "rate" DECIMAL(65,30) NOT NULL,
    "rateType" "RateType" NOT NULL,
    "vehicleType" "VehicleCategory",
    "minEngineCC" INTEGER,
    "maxEngineCC" INTEGER,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rate_history" (
    "id" TEXT NOT NULL,
    "taxRateId" TEXT NOT NULL,
    "oldValue" DECIMAL(65,30) NOT NULL,
    "newValue" DECIMAL(65,30) NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "tax_rate_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "origin_countries" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "flag" TEXT,
    "customsDutyRate" DECIMAL(65,30) NOT NULL,
    "isEU" BOOLEAN NOT NULL DEFAULT false,
    "minShippingCost" DECIMAL(65,30) NOT NULL,
    "maxShippingCost" DECIMAL(65,30) NOT NULL,
    "avgShippingDays" INTEGER,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "origin_countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "currencyName" TEXT NOT NULL,
    "buyRate" DECIMAL(65,30) NOT NULL,
    "sellRate" DECIMAL(65,30) NOT NULL,
    "source" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rate_settings" (
    "id" TEXT NOT NULL,
    "updateMode" TEXT NOT NULL,
    "apiProvider" TEXT,
    "apiKey" TEXT,
    "updateInterval" INTEGER NOT NULL DEFAULT 60,
    "lastAutoUpdate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rate_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "targetType" TEXT NOT NULL,
    "targetIds" TEXT[],
    "sentBy" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_reads" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readBy" TEXT NOT NULL,

    CONSTRAINT "notification_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "galleries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "subscription" "SubscriptionType" NOT NULL DEFAULT 'BASIC',
    "subscriptionEnds" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "galleries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "galleryId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_snapshots" (
    "id" TEXT NOT NULL,
    "rates" JSONB NOT NULL,
    "currencies" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "vin" TEXT,
    "color" TEXT,
    "mileage" INTEGER,
    "fuelType" "FuelType",
    "transmission" "Transmission",
    "engineCC" INTEGER NOT NULL,
    "bodyType" TEXT,
    "originCountryId" TEXT NOT NULL,
    "fobPrice" DECIMAL(65,30) NOT NULL,
    "fobCurrency" TEXT NOT NULL DEFAULT 'USD',
    "shippingCost" DECIMAL(65,30),
    "insuranceCost" DECIMAL(65,30),
    "cifValue" DECIMAL(65,30),
    "customsDuty" DECIMAL(65,30),
    "kdv" DECIMAL(65,30),
    "fif" DECIMAL(65,30),
    "generalFif" DECIMAL(65,30),
    "gkk" DECIMAL(65,30),
    "wharfFee" DECIMAL(65,30),
    "bandrol" DECIMAL(65,30),
    "otherFees" DECIMAL(65,30),
    "totalImportCost" DECIMAL(65,30),
    "additionalExpenses" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(65,30),
    "salePrice" DECIMAL(65,30),
    "profit" DECIMAL(65,30),
    "profitMargin" DECIMAL(65,30),
    "status" "VehicleStatus" NOT NULL DEFAULT 'TRANSIT',
    "estimatedArrival" TIMESTAMP(3),
    "arrivalDate" TIMESTAMP(3),
    "soldDate" TIMESTAMP(3),
    "description" TEXT,
    "galleryId" TEXT NOT NULL,
    "taxSnapshotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "vehicleId" TEXT NOT NULL,

    CONSTRAINT "vehicle_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_documents" (
    "id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "vehicleId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT,

    CONSTRAINT "vehicle_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_expenses" (
    "id" TEXT NOT NULL,
    "type" "ExpenseType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehicleId" TEXT NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "vehicle_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_calculations" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT,
    "galleryId" TEXT NOT NULL,
    "fobPrice" DECIMAL(65,30) NOT NULL,
    "fobCurrency" TEXT NOT NULL,
    "originCountry" TEXT NOT NULL,
    "engineCC" INTEGER NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "modelYear" INTEGER NOT NULL,
    "exchangeRate" DECIMAL(65,30) NOT NULL,
    "shippingCost" DECIMAL(65,30) NOT NULL,
    "insuranceCost" DECIMAL(65,30) NOT NULL,
    "cifValue" DECIMAL(65,30) NOT NULL,
    "customsDuty" DECIMAL(65,30) NOT NULL,
    "kdv" DECIMAL(65,30) NOT NULL,
    "fif" DECIMAL(65,30) NOT NULL,
    "generalFif" DECIMAL(65,30) NOT NULL,
    "gkk" DECIMAL(65,30) NOT NULL,
    "wharfFee" DECIMAL(65,30) NOT NULL,
    "bandrol" DECIMAL(65,30) NOT NULL,
    "otherFees" DECIMAL(65,30) NOT NULL,
    "totalTaxes" DECIMAL(65,30) NOT NULL,
    "totalCostUSD" DECIMAL(65,30) NOT NULL,
    "totalCostTL" DECIMAL(65,30) NOT NULL,
    "taxSnapshotId" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculatedBy" TEXT NOT NULL,

    CONSTRAINT "import_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "unit" TEXT NOT NULL,
    "currentStock" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "minStockLevel" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "barcode" TEXT,
    "description" TEXT,
    "galleryId" TEXT NOT NULL,
    "lastPurchaseAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "note" TEXT,
    "productId" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "identityNo" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "galleryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "salePrice" DECIMAL(65,30) NOT NULL,
    "totalCost" DECIMAL(65,30) NOT NULL,
    "profit" DECIMAL(65,30) NOT NULL,
    "profitMargin" DECIMAL(65,30) NOT NULL,
    "saleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentType" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tax_rates_code_key" ON "tax_rates"("code");

-- CreateIndex
CREATE UNIQUE INDEX "origin_countries_code_key" ON "origin_countries"("code");

-- CreateIndex
CREATE UNIQUE INDEX "notification_reads_notificationId_galleryId_key" ON "notification_reads"("notificationId", "galleryId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_performedBy_idx" ON "audit_logs"("performedBy");

-- CreateIndex
CREATE INDEX "audit_logs_performedAt_idx" ON "audit_logs"("performedAt");

-- CreateIndex
CREATE UNIQUE INDEX "galleries_slug_key" ON "galleries"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_galleryId_idx" ON "users"("galleryId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vin_key" ON "vehicles"("vin");

-- CreateIndex
CREATE INDEX "vehicles_galleryId_idx" ON "vehicles"("galleryId");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicles_brand_model_idx" ON "vehicles"("brand", "model");

-- CreateIndex
CREATE INDEX "vehicle_images_vehicleId_idx" ON "vehicle_images"("vehicleId");

-- CreateIndex
CREATE INDEX "vehicle_documents_vehicleId_idx" ON "vehicle_documents"("vehicleId");

-- CreateIndex
CREATE INDEX "vehicle_expenses_vehicleId_idx" ON "vehicle_expenses"("vehicleId");

-- CreateIndex
CREATE INDEX "import_calculations_vehicleId_idx" ON "import_calculations"("vehicleId");

-- CreateIndex
CREATE INDEX "import_calculations_galleryId_idx" ON "import_calculations"("galleryId");

-- CreateIndex
CREATE INDEX "products_galleryId_idx" ON "products"("galleryId");

-- CreateIndex
CREATE INDEX "stock_movements_productId_idx" ON "stock_movements"("productId");

-- CreateIndex
CREATE INDEX "customers_galleryId_idx" ON "customers"("galleryId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_vehicleId_key" ON "sales"("vehicleId");

-- CreateIndex
CREATE INDEX "sales_customerId_idx" ON "sales"("customerId");

-- CreateIndex
CREATE INDEX "sales_galleryId_idx" ON "sales"("galleryId");

-- AddForeignKey
ALTER TABLE "tax_rate_history" ADD CONSTRAINT "tax_rate_history_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES "tax_rates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "platform_notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_originCountryId_fkey" FOREIGN KEY ("originCountryId") REFERENCES "origin_countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_taxSnapshotId_fkey" FOREIGN KEY ("taxSnapshotId") REFERENCES "tax_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_expenses" ADD CONSTRAINT "vehicle_expenses_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_calculations" ADD CONSTRAINT "import_calculations_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_calculations" ADD CONSTRAINT "import_calculations_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_calculations" ADD CONSTRAINT "import_calculations_taxSnapshotId_fkey" FOREIGN KEY ("taxSnapshotId") REFERENCES "tax_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
