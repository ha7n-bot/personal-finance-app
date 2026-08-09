"use server";

import { revalidatePath } from "next/cache";
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
