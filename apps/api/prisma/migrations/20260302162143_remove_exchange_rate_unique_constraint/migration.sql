-- DropForeignKey
ALTER TABLE "customers" DROP CONSTRAINT "customers_galleryId_fkey";

-- DropForeignKey
ALTER TABLE "import_calculations" DROP CONSTRAINT "import_calculations_galleryId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_galleryId_fkey";

-- DropForeignKey
ALTER TABLE "sales" DROP CONSTRAINT "sales_galleryId_fkey";

-- DropForeignKey
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_galleryId_fkey";

-- CreateIndex
CREATE INDEX "exchange_rates_currencyCode_fetchedAt_idx" ON "exchange_rates"("currencyCode", "fetchedAt");

-- CreateIndex
CREATE INDEX "notification_reads_galleryId_idx" ON "notification_reads"("galleryId");

-- CreateIndex
CREATE INDEX "sales_saleDate_idx" ON "sales"("saleDate");

-- CreateIndex
CREATE INDEX "tax_rate_history_taxRateId_idx" ON "tax_rate_history"("taxRateId");

-- CreateIndex
CREATE INDEX "tax_snapshots_createdAt_idx" ON "tax_snapshots"("createdAt");

-- CreateIndex
CREATE INDEX "vehicles_originCountryId_idx" ON "vehicles"("originCountryId");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_calculations" ADD CONSTRAINT "import_calculations_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
