"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/money";
import { ensureUserWorkspace } from "@/lib/bootstrap-user";

const schema = z.object({
  name: z.string().trim().min(2).max(60),
  type: z.enum(["BANK", "CASH", "SAVINGS", "INVESTMENT"]),
  balance: z.coerce.number().min(0).max(999_999_999_999),
});

export async function completeOnboarding(formData: FormData) {
  const session = await auth();
  if (!session?.user.id) redirect("/login");
  const parsed = schema.safeParse({ name: formData.get("name"), type: formData.get("type"), balance: formData.get("balance") || 0 });
  if (!parsed.success) throw new Error("تحقق من اسم الحساب والرصيد");
  await ensureUserWorkspace(session.user.id);
  await db.$transaction(async (tx) => {
    const primary = await tx.financialAccount.findFirst({ where: { userId: session.user.id, isArchived: false }, orderBy: { createdAt: "asc" } });
    if (primary) await tx.financialAccount.update({ where: { id: primary.id }, data: { name: parsed.data.name, type: parsed.data.type, openingBalance: money(parsed.data.balance), description: "الحساب الأول عند بدء استخدام مالي" } });
    else await tx.financialAccount.create({ data: { userId: session.user.id, name: parsed.data.name, type: parsed.data.type, openingBalance: money(parsed.data.balance) } });
    await tx.user.update({ where: { id: session.user.id }, data: { onboardingCompleted: true } });
    await tx.auditLog.create({ data: { userId: session.user.id, action: "ONBOARDING_COMPLETE", entity: "User", entityId: session.user.id } });
  });
  redirect("/dashboard");
}
