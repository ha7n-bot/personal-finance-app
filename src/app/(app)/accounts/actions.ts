"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/money";

const schema = z.object({ name: z.string().trim().min(2).max(60), type: z.enum(["BANK", "CASH", "INVESTMENT", "EMERGENCY", "SAVINGS"]), balance: z.coerce.number().min(0).max(999_999_999_999) });
export async function addAccount(formData: FormData) {
  const session = await auth(); if (!session?.user.id) throw new Error("يجب تسجيل الدخول أولًا");
  const parsed = schema.safeParse({ name: formData.get("name"), type: formData.get("type"), balance: formData.get("balance") || 0 });
  if (!parsed.success) throw new Error("تحقق من اسم الحساب والرصيد");
  await db.financialAccount.create({ data: { userId: session.user.id, name: parsed.data.name, type: parsed.data.type, openingBalance: money(parsed.data.balance) } });
  for (const path of ["/accounts", "/dashboard", "/transactions"]) revalidatePath(path);
}
export async function archiveAccount(formData: FormData) {
  const session = await auth(); if (!session?.user.id) throw new Error("يجب تسجيل الدخول أولًا");
  if (await db.financialAccount.count({ where: { userId: session.user.id, isArchived: false } }) <= 1) throw new Error("لا يمكن أرشفة الحساب الوحيد");
  await db.financialAccount.updateMany({ where: { id: String(formData.get("id")), userId: session.user.id }, data: { isArchived: true } });
  for (const path of ["/accounts", "/dashboard", "/transactions"]) revalidatePath(path);
}
