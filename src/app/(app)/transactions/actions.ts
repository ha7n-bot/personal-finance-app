"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { installmentRemaining, nextInstallmentAmount, regularInstallmentAmount } from "@/lib/installments";
import { formatSAR, money } from "@/lib/money";
import { nextMonthlyOccurrence } from "@/lib/recurrence";

const optionalPositiveAmount = z.preprocess(
  (value) => value === "" || value === null || value === undefined ? undefined : value,
  z.coerce.number().positive().max(999_999_999_999).optional(),
);

const optionalInstallmentCount = z.preprocess(
  (value) => value === "" || value === null || value === undefined ? undefined : value,
  z.coerce.number().int().min(2).max(120).optional(),
);

const schema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: optionalPositiveAmount,
  totalAmount: optionalPositiveAmount,
  installmentCount: optionalInstallmentCount,
  description: z.string().trim().min(2).max(140),
  accountId: z.string().min(1),
  categoryId: z.string().optional(),
  occurredAt: z.string().optional(),
  plan: z.enum(["ONCE", "MONTHLY", "INSTALLMENTS"]).default("ONCE"),
  notes: z.string().trim().max(500).optional(),
}).superRefine((value, context) => {
  if (value.plan === "INSTALLMENTS") {
    if (value.type !== "EXPENSE") context.addIssue({ code: z.ZodIssueCode.custom, path: ["plan"], message: "الأقساط متاحة للمصروفات" });
    if (!value.totalAmount) context.addIssue({ code: z.ZodIssueCode.custom, path: ["totalAmount"], message: "أدخل إجمالي المبلغ" });
    if (!value.installmentCount) context.addIssue({ code: z.ZodIssueCode.custom, path: ["installmentCount"], message: "أدخل عدد الأقساط" });
    if (value.totalAmount && value.installmentCount && value.totalAmount < value.installmentCount * 0.01) context.addIssue({ code: z.ZodIssueCode.custom, path: ["totalAmount"], message: "الإجمالي صغير جدًا مقارنة بعدد الأقساط" });
  } else if (!value.amount) context.addIssue({ code: z.ZodIssueCode.custom, path: ["amount"], message: "أدخل المبلغ" });
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
    type: formData.get("type"), amount: formData.get("amount"), totalAmount: formData.get("totalAmount"), installmentCount: formData.get("installmentCount"),
    description: formData.get("description"), accountId: formData.get("accountId"),
    categoryId: String(formData.get("categoryId") || "") || undefined, occurredAt: String(formData.get("occurredAt") || "") || undefined,
    plan: formData.get("plan") || "ONCE", notes: String(formData.get("notes") || "") || undefined,
  });
  if (!parsed.success) return { status: "error", message: "تحقق من اسم العملية والمبلغ أو عدد الأقساط والحساب ثم حاول مرة أخرى." };
  const userId = session.user.id;
  try {
    const occurredAt = dateFromInput(parsed.data.occurredAt);
    const isInstallments = parsed.data.plan === "INSTALLMENTS";
    const installmentCount = isInstallments ? parsed.data.installmentCount! : null;
    const totalAmount = isInstallments ? money(parsed.data.totalAmount!) : null;
    const value = isInstallments
      ? nextInstallmentAmount(totalAmount!, installmentCount!, 0)
      : money(parsed.data.amount!);
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
      if (parsed.data.plan !== "ONCE") await tx.recurringPayment.create({ data: {
        userId,
        name: parsed.data.description,
        amount: isInstallments ? regularInstallmentAmount(totalAmount!, installmentCount!) : value,
        transactionType: parsed.data.type,
        frequency: "MONTHLY",
        planType: isInstallments ? "INSTALLMENTS" : "ONGOING",
        totalAmount,
        installmentCount,
        completedInstallments: isInstallments ? 1 : 0,
        nextDueAt: nextMonthlyOccurrence(occurredAt),
        notes: parsed.data.notes,
        accountId: account.id,
        categoryId: category?.id ?? null,
      } });
      await tx.auditLog.create({ data: {
        userId,
        action: parsed.data.plan === "ONCE" ? "TRANSACTION_CREATED" : parsed.data.plan === "MONTHLY" ? "ONGOING_PAYMENT_CREATED" : "INSTALLMENT_PLAN_CREATED",
        entity: "Transaction",
        entityId: transaction.id,
        metadata: { type: parsed.data.type, plan: parsed.data.plan, installmentCount },
      } });
    });
    for (const path of ["/transactions", "/dashboard", "/reports", "/recurring"]) revalidatePath(path);
    if (isInstallments) return {
      status: "success",
      message: `تم تسجيل القسط الأول، والمتبقي ${formatSAR(installmentRemaining(totalAmount!, installmentCount!, 1))} على ${installmentCount! - 1} دفعة.`,
    };
    if (parsed.data.plan === "MONTHLY") return { status: "success", message: "تم تسجيل دفعة اليوم وإضافة التزام شهري مستمر يمكنك إيقافه متى أردت." };
    return { status: "success", message: "تم تسجيل العملية مرة واحدة وحفظها في حسابك." };
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
