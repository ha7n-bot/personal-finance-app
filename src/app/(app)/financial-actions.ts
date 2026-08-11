"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { nextInstallmentAmount } from "@/lib/installments";
import { money } from "@/lib/money";
import { requireUserId } from "@/lib/current-user";
import { nextMonthlyOccurrence, nextRecurringDate } from "@/lib/recurrence";

const text = (data: FormData, key: string) => String(data.get(key) || "").trim();
const amount = (data: FormData, key: string) => {
  const value = money(text(data, key) || "0");
  if (value.lte(0)) throw new Error("يجب أن يكون المبلغ أكبر من صفر");
  return value;
};

const recurringSchema = z.object({
  name: z.string().trim().min(2).max(120), amount: z.coerce.number().positive().max(999_999_999_999),
  transactionType: z.enum(["INCOME", "EXPENSE"]), frequency: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  nextDueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), accountId: z.string().min(1), categoryId: z.string().optional(),
});

export async function createBudget(data: FormData) {
  const userId = await requireUserId();
  const categoryId = text(data, "categoryId");
  if (!await db.category.count({ where: { id: categoryId, userId } })) throw new Error("تصنيف غير صالح");
  const month = new Date(text(data, "month") + "-01T00:00:00.000Z");
  await db.budget.upsert({ where: { userId_categoryId_month: { userId, categoryId, month } }, update: { amount: amount(data, "amount") }, create: { userId, categoryId, month, amount: amount(data, "amount") } });
  revalidatePath("/budgets");
}

export async function createCategory(data: FormData) {
  const userId = await requireUserId(); const name = text(data, "name");
  if (!name) throw new Error("اسم التصنيف مطلوب");
  const kind = text(data, "kind") === "INCOME" ? "INCOME" : "EXPENSE";
  await db.category.upsert({ where: { userId_name: { userId, name } }, update: { kind }, create: { userId, name, kind, color: text(data, "color") || "#0f766e", isEssential: data.get("isEssential") === "on" } });
  revalidatePath("/budgets"); revalidatePath("/transactions");
}

export async function createRecurring(data: FormData) {
  const userId = await requireUserId();
  const parsed = recurringSchema.safeParse({ name: data.get("name"), amount: data.get("amount"), transactionType: data.get("transactionType") || "EXPENSE", frequency: data.get("frequency"), nextDueAt: String(data.get("nextDueAt") || "") || undefined, accountId: data.get("accountId"), categoryId: String(data.get("categoryId") || "") || undefined });
  if (!parsed.success) throw new Error("تحقق من بيانات الالتزام");
  const [account, category] = await Promise.all([
    db.financialAccount.findFirst({ where: { id: parsed.data.accountId, userId, isArchived: false } }),
    parsed.data.categoryId ? db.category.findFirst({ where: { id: parsed.data.categoryId, userId } }) : null,
  ]);
  if (!account) throw new Error("أضف حسابًا صالحًا أولًا");
  if (category && category.kind !== parsed.data.transactionType) throw new Error("التصنيف لا يطابق نوع الالتزام");
  const nextDueAt = parsed.data.nextDueAt ? new Date(`${parsed.data.nextDueAt}T12:00:00.000Z`) : nextMonthlyOccurrence(new Date());
  await db.recurringPayment.create({ data: { userId, name: parsed.data.name, amount: money(parsed.data.amount), transactionType: parsed.data.transactionType, frequency: parsed.data.frequency, nextDueAt, accountId: account.id, categoryId: category?.id ?? null } });
  revalidatePath("/recurring");
  revalidatePath("/dashboard");
}

export async function createDebt(data: FormData) {
  const userId = await requireUserId();
  await db.debt.create({ data: { userId, name: text(data, "name"), originalAmount: amount(data, "originalAmount"), installmentAmount: text(data, "installmentAmount") ? money(text(data, "installmentAmount")) : null, nextPaymentAt: text(data, "nextPaymentAt") ? new Date(text(data, "nextPaymentAt")) : null } });
  revalidatePath("/debts"); revalidatePath("/dashboard");
}

export async function createGoal(data: FormData) {
  const userId = await requireUserId();
  await db.goal.create({ data: { userId, name: text(data, "name"), targetAmount: amount(data, "targetAmount"), currentAmount: money(text(data, "currentAmount") || "0"), targetDate: text(data, "targetDate") ? new Date(text(data, "targetDate")) : null } });
  revalidatePath("/goals");
}

export async function saveEmergencyFund(data: FormData) {
  const userId = await requireUserId();
  await db.emergencyFund.upsert({ where: { userId }, update: { targetMonths: Number(text(data, "targetMonths")), currentAmount: money(text(data, "currentAmount") || "0") }, create: { userId, targetMonths: Number(text(data, "targetMonths")), currentAmount: money(text(data, "currentAmount") || "0") } });
  revalidatePath("/emergency-fund");
}

export async function createGoldAsset(data: FormData) {
  const userId = await requireUserId();
  const requestedId = text(data, "investmentId");
  const existing = requestedId ? await db.investment.findFirst({ where: { id: requestedId, userId } }) : null;
  const investment = existing || await db.investment.create({ data: { userId, name: "الذهب" } });
  const quantityGrams = new Prisma.Decimal(text(data, "quantityGrams")).toDecimalPlaces(4);
  if (quantityGrams.lte(0)) throw new Error("كمية الذهب يجب أن تكون أكبر من صفر");
  await db.goldAsset.create({ data: { investmentId: investment.id, quantityGrams, purchasePricePerGram: money(text(data, "purchasePricePerGram")), currentPricePerGram: text(data, "currentPricePerGram") ? money(text(data, "currentPricePerGram")) : null, purchasedAt: new Date(text(data, "purchasedAt")) } });
  revalidatePath("/investments");
}

export async function markNotificationsRead() {
  const userId = await requireUserId();
  await db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/notifications");
}

export async function updateSettings(data: FormData) {
  const userId = await requireUserId();
  await db.settings.upsert({ where: { userId }, update: { theme: text(data, "theme"), budgetAlerts: data.get("budgetAlerts") === "on", dueDateAlerts: data.get("dueDateAlerts") === "on" }, create: { userId, theme: text(data, "theme"), budgetAlerts: data.get("budgetAlerts") === "on", dueDateAlerts: data.get("dueDateAlerts") === "on" } });
  revalidatePath("/settings");
}

export async function recordDebtPayment(data: FormData) {
  const userId = await requireUserId();
  const debtId = text(data, "debtId");
  const accountId = text(data, "accountId");
  const paymentAmount = amount(data, "amount");
  const [debt, account] = await Promise.all([
    db.debt.findFirst({ where: { id: debtId, userId }, include: { payments: true } }),
    db.financialAccount.findFirst({ where: { id: accountId, userId, isArchived: false } }),
  ]);
  if (!debt || !account) throw new Error("بيانات السداد غير صالحة");
  const paid = debt.payments.reduce((sum, payment) => sum.plus(payment.amount), money(0));
  const remaining = debt.originalAmount.minus(paid);
  if (paymentAmount.gt(remaining)) throw new Error("مبلغ السداد أكبر من المتبقي");
  await db.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({ data: { userId, type: "DEBT_PAYMENT", amount: paymentAmount, sourceAccountId: account.id, description: `سداد ${debt.name}` } });
    await tx.debtPayment.create({ data: { debtId: debt.id, transactionId: transaction.id, amount: paymentAmount } });
    if (paymentAmount.eq(remaining)) await tx.debt.update({ where: { id: debt.id }, data: { status: "PAID", nextPaymentAt: null } });
    await tx.auditLog.create({ data: { userId, action: "DEBT_PAYMENT_CREATED", entity: "Debt", entityId: debt.id, metadata: { amount: paymentAmount.toString() } } });
  });
  revalidatePath("/debts"); revalidatePath("/dashboard"); revalidatePath("/transactions");
}

export async function contributeToGoal(data: FormData) {
  const userId = await requireUserId();
  const goalId = text(data, "goalId");
  const contribution = amount(data, "amount");
  const goal = await db.goal.findFirst({ where: { id: goalId, userId, status: "ACTIVE" } });
  if (!goal) throw new Error("الهدف غير موجود");
  const next = Prisma.Decimal.min(goal.targetAmount, goal.currentAmount.plus(contribution));
  await db.goal.update({ where: { id: goal.id }, data: { currentAmount: next, status: next.eq(goal.targetAmount) ? "COMPLETED" : "ACTIVE" } });
  revalidatePath("/goals"); revalidatePath("/dashboard");
}

export async function toggleRecurring(data: FormData) {
  const userId = await requireUserId();
  const id = text(data, "id");
  const row = await db.recurringPayment.findFirst({ where: { id, userId } });
  if (!row) throw new Error("الالتزام غير موجود");
  if (!row.active && row.planType === "INSTALLMENTS" && row.installmentCount && row.completedInstallments >= row.installmentCount) throw new Error("خطة الأقساط مكتملة بالفعل");
  await db.recurringPayment.update({ where: { id }, data: { active: !row.active } });
  revalidatePath("/recurring");
  revalidatePath("/dashboard");
}

export async function recordRecurringPayment(data: FormData) {
  const userId = await requireUserId();
  const id = text(data, "id");
  const row = await db.recurringPayment.findFirst({ where: { id, userId } });
  if (!row || !row.active) throw new Error("هذه الدفعة غير متاحة الآن");
  if (!row.accountId) throw new Error("اختر حسابًا صالحًا لهذه الدفعة");
  if (row.transactionType !== "EXPENSE" && row.transactionType !== "INCOME") throw new Error("نوع الدفعة غير مدعوم");
  const account = await db.financialAccount.findFirst({ where: { id: row.accountId, userId, isArchived: false } });
  if (!account) throw new Error("الحساب المرتبط غير متاح");

  const fixed = row.planType === "INSTALLMENTS";
  if (fixed && (!row.totalAmount || !row.installmentCount)) throw new Error("بيانات خطة الأقساط غير مكتملة");
  if (fixed && row.completedInstallments >= row.installmentCount!) throw new Error("تم سداد جميع الأقساط");
  const paymentAmount = fixed
    ? nextInstallmentAmount(row.totalAmount!, row.installmentCount!, row.completedInstallments)
    : row.amount;
  const completedInstallments = fixed ? row.completedInstallments + 1 : row.completedInstallments;
  const completed = fixed && completedInstallments >= row.installmentCount!;
  const nextDueAt = nextRecurringDate(row.nextDueAt, row.frequency);

  await db.$transaction(async (tx) => {
    const claimed = await tx.recurringPayment.updateMany({
      where: { id: row.id, userId, active: true, nextDueAt: row.nextDueAt, completedInstallments: row.completedInstallments },
      data: fixed
        ? { completedInstallments, active: !completed, ...(completed ? {} : { nextDueAt }) }
        : { nextDueAt },
    });
    if (!claimed.count) throw new Error("تم تسجيل هذه الدفعة بالفعل");
    const transaction = await tx.transaction.create({ data: {
      userId,
      type: row.transactionType,
      amount: paymentAmount,
      description: fixed ? `قسط ${row.name}` : row.name,
      notes: row.notes,
      categoryId: row.categoryId,
      sourceAccountId: row.transactionType === "EXPENSE" ? account.id : null,
      destinationAccountId: row.transactionType === "INCOME" ? account.id : null,
    } });
    await tx.auditLog.create({ data: {
      userId,
      action: fixed ? "INSTALLMENT_RECORDED" : "RECURRING_PAYMENT_RECORDED",
      entity: "RecurringPayment",
      entityId: row.id,
      metadata: { transactionId: transaction.id, amount: paymentAmount.toString(), completedInstallments, completed },
    } });
  });
  for (const path of ["/recurring", "/dashboard", "/transactions", "/reports"]) revalidatePath(path);
}
