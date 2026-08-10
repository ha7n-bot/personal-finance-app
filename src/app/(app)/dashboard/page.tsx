import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatSAR } from "@/lib/money";
import { accountDelta, spendingTotal } from "@/lib/financial/ledger";
import { ensureUserWorkspace } from "@/lib/bootstrap-user";

const labels = { BANK: "بنكي", CASH: "نقدي", SAVINGS: "ادخار", INVESTMENT: "استثمار", EMERGENCY: "صندوق طوارئ" } as const;
export default async function Dashboard() {
  const session = await auth(); if (!session?.user.id) redirect("/login");
  await ensureUserWorkspace(session.user.id);
  const user = await db.user.findUnique({ where: { id: session.user.id }, include: { accounts: { where: { isArchived: false }, orderBy: { createdAt: "asc" } } } });
  if (!user?.onboardingCompleted) redirect("/onboarding");
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const nextThirtyDays = new Date(); nextThirtyDays.setDate(nextThirtyDays.getDate() + 30);
  const [transactions, upcoming] = await Promise.all([
    db.transaction.findMany({ where: { userId: user.id, status: "POSTED" }, include: { category: true }, orderBy: { occurredAt: "desc" } }),
    db.recurringPayment.findMany({ where: { userId: user.id, active: true, nextDueAt: { lte: nextThirtyDays } }, orderBy: { nextDueAt: "asc" }, take: 5 }),
  ]);
  const month = transactions.filter((row) => row.occurredAt >= monthStart);
  const income = month.filter((row) => row.type === "INCOME").reduce((sum, row) => sum.plus(row.amount), new Prisma.Decimal(0));
  const expenses = spendingTotal(month); const net = income.minus(expenses);
  const balance = user.accounts.reduce((sum, account) => sum.plus(account.openingBalance).plus(accountDelta(account.id, transactions)), new Prisma.Decimal(0));
  const rate = income.gt(0) ? net.div(income).mul(100) : new Prisma.Decimal(0);
  const cards = [["إجمالي الرصيد", formatSAR(balance), `${user.accounts.length} حساب`], ["دخل هذا الشهر", formatSAR(income), `${month.filter((r) => r.type === "INCOME").length} عملية`], ["مصروف هذا الشهر", formatSAR(expenses), `${month.filter((r) => r.type === "EXPENSE").length} عملية`], ["صافي الشهر", formatSAR(net), `نسبة الفائض ${rate.toDecimalPlaces(0)}٪`]];
  return <div><div className="page-heading-row"><div><span className="eyebrow">لوحتك المالية</span><h1>أهلًا، {user.name || "بك"}</h1><p className="muted">كل أرقامك الأساسية وآخر ما حدث في مكان واحد.</p></div><Link className="btn" href="/transactions">إضافة عملية</Link></div>
    <section className="registered-metric-grid">{cards.map(([label, value, hint]) => <article className="card registered-metric" key={label}><span>{label}</span><strong className="number">{value}</strong><small>{hint}</small></article>)}</section>
    <section className="registered-dashboard-grid"><article className="card dashboard-panel"><h2>الحسابات</h2>{user.accounts.map((account) => <div className="dashboard-line" key={account.id}><span><strong>{account.name}</strong><small>{labels[account.type]}</small></span><strong>{formatSAR(account.openingBalance.plus(accountDelta(account.id, transactions)))}</strong></div>)}</article><article className="card dashboard-panel"><h2>آخر العمليات</h2>{transactions.slice(0, 5).map((row) => <div className="dashboard-line" key={row.id}><span><strong>{row.description || "عملية"}</strong><small>{row.category?.name || "بدون تصنيف"} · {row.occurredAt.toLocaleDateString("ar-SA")}</small></span><strong>{formatSAR(row.amount)}</strong></div>)}{!transactions.length ? <p className="muted">لا توجد عمليات بعد.</p> : null}</article><article className="card dashboard-panel upcoming-panel"><h2>الاستحقاقات القادمة</h2>{upcoming.map((row) => <div className="dashboard-line" key={row.id}><span><strong>{row.name}</strong><small>{row.nextDueAt.toLocaleDateString("ar-SA")}</small></span><strong>{formatSAR(row.amount)}</strong></div>)}{!upcoming.length ? <p className="muted">لا توجد استحقاقات قريبة.</p> : null}</article></section>
  </div>;
}
