"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { money } from "@/lib/money";
import { requireUserId } from "@/lib/current-user";

const text = (data: FormData, key: string) => String(data.get(key) || "").trim();
const amount = (data: FormData, key: string) => {
  const value = money(text(data, key) || "0");
  if (value.lte(0)) throw new Error("يجب أن يكون المبلغ أكبر من صفر");
  return value;
};

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
  await db.category.upsert({ where: { userId_name: { userId, name } }, update: {}, create: { userId, name, color: text(data, "color") || "#0f766e", isEssential: data.get("isEssential") === "on" } });
  revalidatePath("/budgets"); revalidatePath("/transactions");
}

export async function createRecurring(data: FormData) {
  const userId = await requireUserId();
  const accountId = text(data, "accountId") || null;
  if (accountId && !await db.account.count({ where: { id: accountId, userId } })) throw new Error("حساب غير صالح");
  await db.recurringPayment.create({ data: { userId, name: text(data, "name"), amount: amount(data, "amount"), frequency: text(data, "frequency") as "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY", nextDueAt: new Date(text(data, "nextDueAt")), accountId } });
  revalidatePath("/recurring");
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
  await db.goldAsset.create({ data: { investmentId: investment.id, quantityGrams: money(text(data, "quantityGrams")), purchasePricePerGram: money(text(data, "purchasePricePerGram")), currentPricePerGram: text(data, "currentPricePerGram") ? money(text(data, "currentPricePerGram")) : null, purchasedAt: new Date(text(data, "purchasedAt")) } });
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
    db.account.findFirst({ where: { id: accountId, userId, isArchived: false } }),
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
  await db.recurringPayment.update({ where: { id }, data: { active: !row.active } });
  revalidatePath("/recurring");
}
