"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/money";
import { nextMonthlyOccurrence } from "@/lib/recurrence";

const schema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive().max(999_999_999_999),
  description: z.string().trim().min(2).max(140),
  accountId: z.string().min(1),
  categoryId: z.string().optional(),
  occurredAt: z.string().optional(),
  recurrence: z.enum(["ONCE", "MONTHLY"]).default("ONCE"),
  notes: z.string().trim().max(500).optional(),
});

export type TransactionActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function dateFromInput(value?: string) {
  if (!value) return new Date();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("التاريخ غير صالح");
  const date = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error("التاريخ غير صالح");
  return date;
}

export async function addTransaction(_previous: TransactionActionState, formData: FormData): Promise<TransactionActionState> {
  const session = await auth();
  if (!session?.user.id) return { status: "error", message: "انتهت جلسة الدخول. سجّل الدخول ثم حاول مرة أخرى." };
  const parsed = schema.safeParse({
    type: formData.get("type"), amount: formData.get("amount"), description: formData.get("description"), accountId: formData.get("accountId"),
    categoryId: String(formData.get("categoryId") || "") || undefined, occurredAt: String(formData.get("occurredAt") || "") || undefined,
    recurrence: formData.get("recurrence") || "ONCE", notes: String(formData.get("notes") || "") || undefined,
  });
  if (!parsed.success) return { status: "error", message: "تحقق من اسم العملية والمبلغ والحساب ثم حاول مرة أخرى." };
  const userId = session.user.id;
  try {
    const occurredAt = dateFromInput(parsed.data.occurredAt);
    const value = money(parsed.data.amount);
    const [account, category] = await Promise.all([
      db.financialAccount.findFirst({ where: { id: parsed.data.accountId, userId, isArchived: false } }),
      parsed.data.categoryId ? db.category.findFirst({ where: { id: parsed.data.categoryId, userId } }) : null,
    ]);
    if (!account) return { status: "error", message: "لم نجد الحساب المختار. افتح الحسابات وأضف حسابًا صالحًا." };
    if (parsed.data.categoryId && !category) return { status: "error", message: "التصنيف المختار غير متاح." };
    if (category && category.kind !== parsed.data.type) return { status: "error", message: "اختر تصنيفًا يطابق نوع العملية." };

    await db.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({ data: {
        userId, type: parsed.data.type, amount: value, description: parsed.data.description, notes: parsed.data.notes,
        categoryId: category?.id ?? null, occurredAt,
        sourceAccountId: parsed.data.type === "EXPENSE" ? account.id : null,
        destinationAccountId: parsed.data.type === "INCOME" ? account.id : null,
      } });
      if (parsed.data.recurrence === "MONTHLY") await tx.recurringPayment.create({ data: {
        userId, name: parsed.data.description, amount: value, transactionType: parsed.data.type, frequency: "MONTHLY",
        nextDueAt: nextMonthlyOccurrence(occurredAt), notes: parsed.data.notes, accountId: account.id, categoryId: category?.id ?? null,
      } });
      await tx.auditLog.create({ data: { userId, action: parsed.data.recurrence === "MONTHLY" ? "RECURRING_TRANSACTION_CREATED" : "TRANSACTION_CREATED", entity: "Transaction", entityId: transaction.id, metadata: { type: parsed.data.type, recurrence: parsed.data.recurrence } } });
    });
    for (const path of ["/transactions", "/dashboard", "/reports", "/recurring"]) revalidatePath(path);
    return { status: "success", message: parsed.data.recurrence === "MONTHLY" ? "تم حفظ العملية وإضافة موعدها الشهري القادم." : "تم حفظ العملية في حسابك بنجاح." };
  } catch {
    return { status: "error", message: "تعذر حفظ العملية الآن. لم نفقد بيانات النموذج؛ حاول مرة أخرى." };
  }
}

export async function deleteTransaction(formData: FormData) {
  const session = await auth();
  if (!session?.user.id) throw new Error("يجب تسجيل الدخول أولًا");
  await db.transaction.deleteMany({ where: { id: String(formData.get("id")), userId: session.user.id } });
  for (const path of ["/transactions", "/dashboard", "/reports"]) revalidatePath(path);
}
