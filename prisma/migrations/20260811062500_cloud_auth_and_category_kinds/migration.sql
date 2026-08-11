-- Preserve the existing Account and AuthAccount tables while extending the
-- registered-user workspace needed by Google login and recurring operations.

CREATE TYPE "CategoryKind" AS ENUM ('INCOME', 'EXPENSE');

ALTER TABLE "Category"
ADD COLUMN "kind" "CategoryKind" NOT NULL DEFAULT 'EXPENSE';

UPDATE "Category"
SET "kind" = 'INCOME'
WHERE "name" IN ('الراتب', 'عمل أو مشروع', 'دخل إضافي', 'عوائد استثمار');

ALTER TABLE "RecurringPayment"
ADD COLUMN "transactionType" "TransactionType" NOT NULL DEFAULT 'EXPENSE';

CREATE TABLE "MobileLoginToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MobileLoginToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MobileLoginToken_tokenHash_key"
ON "MobileLoginToken"("tokenHash");

CREATE INDEX "MobileLoginToken_userId_expiresAt_idx"
ON "MobileLoginToken"("userId", "expiresAt");

CREATE INDEX "Category_userId_kind_idx"
ON "Category"("userId", "kind");

ALTER TABLE "MobileLoginToken"
ADD CONSTRAINT "MobileLoginToken_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
