"use server";
import { revalidatePath } from "next/cache";
import { TransactionType } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/money";

export async function addTransaction(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const type = String(formData.get("type")) as TransactionType;
  const accountId = String(formData.get("accountId"));
  const categoryId = String(formData.get("categoryId") || "") || null;
  const amount = money(String(formData.get("amount")));
  if (amount.lte(0)) throw new Error("Invalid amount");
  if (!(await db.account.count({ where: { id: accountId, userId: session.user.id } }))) throw new Error("Forbidden");
  if (categoryId && !(await db.category.count({ where: { id: categoryId, userId: session.user.id } }))) throw new Error("Forbidden");
  await db.transaction.create({ data: { userId: session.user.id, type, amount, description: String(formData.get("description") || ""), categoryId, sourceAccountId: type === "INCOME" ? null : accountId, destinationAccountId: type === "INCOME" ? accountId : null } });
  revalidatePath("/transactions"); revalidatePath("/dashboard");
}
