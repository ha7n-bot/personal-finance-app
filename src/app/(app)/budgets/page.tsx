import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formatSAR } from "@/lib/money";
import { requireUserId } from "@/lib/current-user";
import { createBudget, createCategory } from "../financial-actions";

export default async function BudgetsPage() {
  const userId = await requireUserId();
  const start = new Date(); start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0);
  const [categories, budgets, expenses] = await Promise.all([
    db.category.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.budget.findMany({ where: { userId, month: start }, include: { category: true } }),
    db.transaction.groupBy({ by: ["categoryId"], where: { userId, type: "EXPENSE", occurredAt: { gte: start }, categoryId: { not: null } }, _sum: { amount: true } }),
  ]);
  const spent = new Map(expenses.map((row) => [row.categoryId, row._sum.amount || new Prisma.Decimal(0)]));
  return <div><h1 className="text-3xl font-bold mb-2">الميزانية الشهرية</h1><p className="muted mb-8">راقب المصروف والمتبقي لكل تصنيف.</p><div className="grid lg:grid-cols-[1fr_360px] gap-5"><section className="space-y-4">{budgets.map((budget) => { const used = spent.get(budget.categoryId) || new Prisma.Decimal(0); const percent = Math.min(100, used.div(budget.amount).mul(100).toNumber()); return <article className="card p-5" key={budget.id}><div className="flex justify-between"><strong>{budget.category.name}</strong><span>{formatSAR(used)} / {formatSAR(budget.amount)}</span></div><div className="h-2 rounded-full bg-black/10 mt-4 overflow-hidden"><div className={`h-full ${percent >= 100 ? "bg-red-500" : percent >= 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${percent}%` }}/></div><p className="muted text-sm mt-3">المتبقي {formatSAR(Prisma.Decimal.max(0, budget.amount.minus(used)))}</p></article>; })}{!budgets.length && <div className="card p-8 muted">لا توجد ميزانية لهذا الشهر.</div>}</section><aside className="space-y-4"><form action={createBudget} className="card p-6 space-y-4"><h2 className="text-xl font-bold">تحديد ميزانية</h2><select className="field" name="categoryId" required><option value="">اختر التصنيف</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select><input className="field" type="month" name="month" defaultValue={start.toISOString().slice(0, 7)} required/><input className="field" type="number" name="amount" min="1" step="0.01" placeholder="الميزانية بالريال" required/><button className="btn w-full">حفظ</button></form><form action={createCategory} className="card p-6 space-y-4"><h2 className="text-xl font-bold">تصنيف جديد</h2><input className="field" name="name" placeholder="مثال: التسوق" required/><input className="field h-12" name="color" type="color" defaultValue="#0f766e"/><label className="flex gap-2"><input name="isEssential" type="checkbox"/> مصروف أساسي</label><button className="btn w-full">إضافة التصنيف</button></form></aside></div></div>;
}
