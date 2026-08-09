"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/money";

const defaultAccounts = [
  { name: "البنك الأول", type: "BANK" as const },
  { name: "البنك الثاني", type: "BANK" as const },
  { name: "الكاش", type: "CASH" as const },
];

const defaultCategories = [
  "كهرباء", "بنزين", "إنترنت", "تسويق", "أقساط", "استثمار", "صندوق طوارئ",
];

export async function completeOnboarding(formData: FormData) {
  const session = await auth();
  if (!session?.user.id) redirect("/login");

  await db.$transaction(async (tx) => {
    for (const [index, account] of defaultAccounts.entries()) {
      await tx.account.create({
        data: {
          userId: session.user.id,
          name: account.name,
          type: account.type,
          openingBalance: money(String(formData.get(`balance${index}`) || "0")),
        },
      });
    }

    for (const name of defaultCategories) {
      await tx.category.upsert({
        where: { userId_name: { userId: session.user.id, name } },
        update: {},
        create: { userId: session.user.id, name, isSystem: true },
      });
    }

    await tx.user.update({ where: { id: session.user.id }, data: { onboardingCompleted: true } });
    await tx.auditLog.create({ data: { userId: session.user.id, action: "ONBOARDING_COMPLETE", entity: "User", entityId: session.user.id } });
  });

  redirect("/dashboard");
}
