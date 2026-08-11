import { Prisma } from "@prisma/client";
import { money } from "@/lib/money";

function normalized(total: Prisma.Decimal.Value, count: number) {
  const value = money(total);
  if (value.lte(0)) throw new Error("إجمالي الأقساط يجب أن يكون أكبر من صفر");
  if (!Number.isInteger(count) || count < 2 || count > 120) throw new Error("عدد الأقساط يجب أن يكون بين 2 و120");
  if (value.lt(new Prisma.Decimal(count).mul("0.01"))) throw new Error("إجمالي الأقساط صغير جدًا مقارنة بعددها");
  return { value, count };
}

export function regularInstallmentAmount(total: Prisma.Decimal.Value, count: number) {
  const plan = normalized(total, count);
  return money(plan.value.div(plan.count));
}

export function installmentRemaining(total: Prisma.Decimal.Value, count: number, completed: number) {
  const plan = normalized(total, count);
  const paidCount = Math.max(0, Math.min(plan.count, Math.trunc(completed)));
  if (paidCount >= plan.count) return money(0);
  return money(Prisma.Decimal.max(0, plan.value.minus(regularInstallmentAmount(plan.value, plan.count).mul(paidCount))));
}

export function nextInstallmentAmount(total: Prisma.Decimal.Value, count: number, completed: number) {
  const plan = normalized(total, count);
  const paidCount = Math.max(0, Math.trunc(completed));
  if (paidCount >= plan.count) return money(0);
  if (paidCount === plan.count - 1) return installmentRemaining(plan.value, plan.count, paidCount);
  return regularInstallmentAmount(plan.value, plan.count);
}
