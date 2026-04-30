-- Soft delete columns
ALTER TABLE "customers" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "products" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Indexes to keep active-record queries fast
CREATE INDEX "customers_deletedAt_idx" ON "customers"("deletedAt");
CREATE INDEX "products_deletedAt_idx" ON "products"("deletedAt");
CREATE INDEX "orders_deletedAt_idx" ON "orders"("deletedAt");
