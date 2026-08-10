import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/money";
import { nextDueDay } from "@/lib/recurrence";

const account = z.object({ id: z.string().max(100), name: z.string().trim().min(1).max(80), institution: z.string().max(100).optional(), kind: z.enum(["bank", "cash", "savings", "wallet", "investment"]), openingBalance: z.number().finite().min(0), color: z.string().max(30).optional() });
const category = z.object({ id: z.string().max(100), name: z.string().trim().min(1).max(80), color: z.string().max(30), kind: z.enum(["income", "expense"]), icon: z.string().max(30).optional(), protected: z.boolean().optional() });
const transaction = z.object({ id: z.string().max(100), title: z.string().trim().min(1).max(140), amount: z.number().finite().positive(), kind: z.enum(["income", "expense"]), categoryId: z.string().max(100), accountId: z.string().max(100), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), note: z.string().max(500).optional() });
const budget = z.object({ id: z.string().max(100), month: z.string().regex(/^\d{4}-\d{2}$/), categoryId: z.string().max(100), amount: z.number().finite().positive() });
const commitment = z.object({ id: z.string().max(100), title: z.string().trim().min(1).max(120), amount: z.number().finite().positive(), dueDay: z.number().int().min(1).max(31), categoryId: z.string().max(100), paidMonths: z.array(z.string().regex(/^\d{4}-\d{2}$/)).max(240) });
const schema = z.object({ version: z.union([z.literal(3), z.literal(4)]), accounts: z.array(account).max(100), categories: z.array(category).max(300), transactions: z.array(transaction).max(20_000), budgets: z.array(budget).max(2_000), commitments: z.array(commitment).max(500) });
const accountType = { bank: "BANK", cash: "CASH", savings: "SAVINGS", wallet: "CASH", investment: "INVESTMENT" } as const;

export async function POST(request: Request) {
  const session = await auth(); if (!session?.user.id) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "تعذر قراءة البيانات المحلية" }, { status: 400 });
  const state = parsed.data;
  if (!(state.accounts.length || state.transactions.length || state.budgets.length || state.commitments.length)) return NextResponse.json({ ok: true, empty: true });
  if (await db.auditLog.findFirst({ where: { userId: session.user.id, action: "DEMO_DATA_IMPORTED" } })) return NextResponse.json({ ok: true, alreadyImported: true });
  const result = await db.$transaction(async (tx) => {
    const accountIds = new Map<string, string>(); const categoryIds = new Map<string, string>();
    const existing = await tx.financialAccount.findMany({ where: { userId: session.user.id, isArchived: false }, orderBy: { createdAt: "asc" } });
    const transactionCount = await tx.transaction.count({ where: { userId: session.user.id } });
    for (const [index, row] of state.accounts.entries()) {
      const data = { userId: session.user.id, name: row.name, type: accountType[row.kind], openingBalance: money(row.openingBalance), description: row.institution || "مستورد من النسخة المحلية" };
      const placeholder = index === 0 && transactionCount === 0 && existing.length === 1 && existing[0].name === "الحساب الرئيسي" && existing[0].openingBalance.eq(0);
      const saved = placeholder ? await tx.financialAccount.update({ where: { id: existing[0].id }, data }) : await tx.financialAccount.create({ data });
      accountIds.set(row.id, saved.id);
    }
    for (const row of state.categories) {
      const saved = await tx.category.upsert({ where: { userId_name: { userId: session.user.id, name: row.name } }, update: { kind: row.kind === "income" ? "INCOME" : "EXPENSE", color: row.color, icon: row.icon || "circle" }, create: { userId: session.user.id, name: row.name, kind: row.kind === "income" ? "INCOME" : "EXPENSE", color: row.color, icon: row.icon || "circle", isSystem: Boolean(row.protected) } });
      categoryIds.set(row.id, saved.id);
    }
    let transactions = 0;
    for (const row of state.transactions) {
      const accountId = accountIds.get(row.accountId); if (!accountId) continue;
      await tx.transaction.create({ data: { userId: session.user.id, type: row.kind === "income" ? "INCOME" : "EXPENSE", amount: money(row.amount), description: row.title, notes: row.note, categoryId: categoryIds.get(row.categoryId) ?? null, occurredAt: new Date(`${row.date}T12:00:00.000Z`), sourceAccountId: row.kind === "expense" ? accountId : null, destinationAccountId: row.kind === "income" ? accountId : null } }); transactions += 1;
    }
    let budgets = 0;
    for (const row of state.budgets) { const categoryId = categoryIds.get(row.categoryId); if (!categoryId) continue; const month = new Date(`${row.month}-01T00:00:00.000Z`); await tx.budget.upsert({ where: { userId_categoryId_month: { userId: session.user.id, categoryId, month } }, update: { amount: money(row.amount) }, create: { userId: session.user.id, categoryId, month, amount: money(row.amount) } }); budgets += 1; }
    const defaultAccountId = accountIds.values().next().value || existing[0]?.id; let commitments = 0;
    if (defaultAccountId) for (const row of state.commitments) { await tx.recurringPayment.create({ data: { userId: session.user.id, name: row.title, amount: money(row.amount), transactionType: "EXPENSE", frequency: "MONTHLY", nextDueAt: nextDueDay(row.dueDay), accountId: defaultAccountId, categoryId: categoryIds.get(row.categoryId) ?? null, notes: "مستورد من الالتزامات المحلية" } }); commitments += 1; }
    await tx.user.update({ where: { id: session.user.id }, data: { onboardingCompleted: true } });
    await tx.auditLog.create({ data: { userId: session.user.id, action: "DEMO_DATA_IMPORTED", entity: "User", entityId: session.user.id, metadata: { accounts: state.accounts.length, transactions, budgets, commitments } } });
    return { accounts: state.accounts.length, transactions, budgets, commitments };
  });
  return NextResponse.json({ ok: true, imported: result });
}
