CREATE TYPE "RecurringPlanType" AS ENUM ('ONGOING', 'INSTALLMENTS');

ALTER TABLE "RecurringPayment"
ADD COLUMN "planType" "RecurringPlanType" NOT NULL DEFAULT 'ONGOING',
ADD COLUMN "totalAmount" DECIMAL(18, 2),
ADD COLUMN "installmentCount" INTEGER,
ADD COLUMN "completedInstallments" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "RecurringPayment"
ADD CONSTRAINT "RecurringPayment_completedInstallments_check"
CHECK ("completedInstallments" >= 0),
ADD CONSTRAINT "RecurringPayment_installmentPlan_check"
CHECK (
  "planType" = 'ONGOING'
  OR (
    "totalAmount" IS NOT NULL
    AND "installmentCount" BETWEEN 2 AND 120
    AND "totalAmount" >= "installmentCount" * 0.01
    AND "completedInstallments" <= "installmentCount"
  )
);
