import { CategoryKind } from "@prisma/client";
import { db } from "@/lib/db";

const DEFAULT_CATEGORIES = [
  ["الراتب", CategoryKind.INCOME, "wallet", "#16805f", true],
  ["عمل أو مشروع", CategoryKind.INCOME, "briefcase", "#287f71", false],
  ["دخل إضافي", CategoryKind.INCOME, "plus", "#3979b7", false],
  ["عوائد استثمار", CategoryKind.INCOME, "chart", "#4d7f45", false],
  ["السكن والإيجار", CategoryKind.EXPENSE, "home", "#3979b7", true],
  ["المقاضي", CategoryKind.EXPENSE, "cart", "#3d927d", true],
  ["المطاعم والقهوة", CategoryKind.EXPENSE, "coffee", "#d99b2b", false],
  ["الكهرباء والمياه", CategoryKind.EXPENSE, "bolt", "#e0a32f", true],
  ["الجوال والإنترنت", CategoryKind.EXPENSE, "phone", "#577590", true],
  ["الاشتراكات", CategoryKind.EXPENSE, "repeat", "#8b63b8", false],
  ["النقل والمواصلات", CategoryKind.EXPENSE, "car", "#3e7890", true],
  ["الوقود", CategoryKind.EXPENSE, "fuel", "#b36b3f", true],
  ["الصحة والعلاج", CategoryKind.EXPENSE, "health", "#dc6670", true],
  ["التعليم", CategoryKind.EXPENSE, "book", "#3979b7", false],
  ["أقساط وديون", CategoryKind.EXPENSE, "receipt", "#d25861", true],
  ["الترفيه", CategoryKind.EXPENSE, "spark", "#8b63b8", false],
  ["الصدقة والتبرعات", CategoryKind.EXPENSE, "heart", "#1d8a68", false],
  ["مصروف آخر", CategoryKind.EXPENSE, "circle", "#71857e", false],
] as const;

/** Repair old workspaces and make new accounts immediately usable. */
export async function ensureUserWorkspace(userId: string) {
  await db.$transaction(async (tx) => {
    await tx.settings.upsert({ where: { userId }, update: {}, create: { userId } });
    if (await tx.financialAccount.count({ where: { userId } }) === 0) {
      await tx.financialAccount.create({
        data: {
          userId,
          name: "الحساب الرئيسي",
          type: "CASH",
          openingBalance: 0,
          description: "حساب البداية؛ يمكنك تغيير اسمه أو إضافة حسابات أخرى.",
        },
      });
    }
    for (const [name, kind, icon, color, essential] of DEFAULT_CATEGORIES) {
      await tx.category.upsert({
        where: { userId_name: { userId, name } },
        update: { kind, icon, color, isEssential: essential, isSystem: true },
        create: { userId, name, kind, icon, color, isEssential: essential, isSystem: true },
      });
    }
  });
}
