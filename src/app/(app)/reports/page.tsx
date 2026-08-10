import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formatSAR } from "@/lib/money";
import { requireUserId } from "@/lib/current-user";
import { spendingTotal } from "@/lib/financial/ledger";

type Period = "month" | "quarter" | "sixMonths" | "year";
const labels: Record<Period, string> = { month: "هذا الشهر", quarter: "آخر 3 أشهر", sixMonths: "آخر 6 أشهر", year: "آخر 12 شهرًا" };
function periodStart(period: Period) { const now = new Date(); const months = period === "month" ? 1 : period === "quarter" ? 3 : period === "sixMonths" ? 6 : 12; return new Date(now.getFullYear(), now.getMonth() - months + 1, 1); }
function monthKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
function monthName(key: string) { const [year, month] = key.split("-").map(Number); return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { month: "short" }).format(new Date(year, month - 1, 1)); }
function monthlyEquivalent(amount: Prisma.Decimal, frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM") { if (frequency === "WEEKLY") return amount.mul(52).div(12); if (frequency === "QUARTERLY") return amount.div(3); if (frequency === "YEARLY") return amount.div(12); return amount; }

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const userId = await requireUserId(); const requested = (await searchParams).period;
  const period: Period = requested === "quarter" || requested === "sixMonths" || requested === "year" ? requested : "month";
  const start = periodStart(period); const chartStart = periodStart("sixMonths"); const queryStart = start < chartStart ? start : chartStart;
  const [rows, recurring] = await Promise.all([
    db.transaction.findMany({ where: { userId, occurredAt: { gte: queryStart }, status: "POSTED" }, include: { category: true }, orderBy: { occurredAt: "asc" } }),
    db.recurringPayment.findMany({ where: { userId, active: true, transactionType: "EXPENSE" } }),
  ]);
  const selected = rows.filter((row) => row.occurredAt >= start);
  const income = selected.filter((row) => row.type === "INCOME").reduce((sum, row) => sum.plus(row.amount), new Prisma.Decimal(0));
  const expense = spendingTotal(selected); const net = income.minus(expense); const rate = income.gt(0) ? net.div(income).mul(100) : new Prisma.Decimal(0);
  const daily = expense.div(Math.max(1, Math.ceil((Date.now() - start.getTime()) / 86_400_000)));
  const recurringTotal = recurring.reduce((sum, row) => sum.plus(monthlyEquivalent(row.amount, row.frequency)), new Prisma.Decimal(0));
  const categories = new Map<string, Prisma.Decimal>(); selected.filter((row) => row.type === "EXPENSE").forEach((row) => { const name = row.category?.name || "بدون تصنيف"; categories.set(name, (categories.get(name) || new Prisma.Decimal(0)).plus(row.amount)); });
  const top = [...categories].sort((a, b) => b[1].cmp(a[1])).slice(0, 7);
  const keys = Array.from({ length: 6 }, (_, index) => { const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() - 5 + index); return monthKey(date); });
  const trend = keys.map((key) => { const values = rows.filter((row) => monthKey(row.occurredAt) === key); return { key, income: values.filter((row) => row.type === "INCOME").reduce((sum, row) => sum.plus(row.amount), new Prisma.Decimal(0)), expense: spendingTotal(values) }; });
  const max = Math.max(1, ...trend.flatMap((row) => [row.income.toNumber(), row.expense.toNumber()]));
  const metrics = [["إجمالي الدخل", formatSAR(income)], ["إجمالي المصروف", formatSAR(expense)], ["صافي الفترة", formatSAR(net)], ["نسبة الفائض", `${rate.toDecimalPlaces(0)}٪`], ["متوسط المصروف اليومي", formatSAR(daily)], ["متوسط الالتزامات الشهري", formatSAR(recurringTotal)]];
  return <div><div className="page-heading-row"><div><span className="eyebrow">تحليل مبني على بياناتك</span><h1>التقارير المالية</h1><p className="muted">افهم أين يذهب المال وكيف يتغير دخلك وصرفك.</p></div><form className="report-period-form"><select className="field" name="period" defaultValue={period}>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button className="secondary-button">عرض</button></form></div>
    <section className="report-summary-grid">{metrics.map(([label, value]) => <article className="card registered-metric" key={label}><span>{label}</span><strong>{value}</strong><small>{labels[period]}</small></article>)}</section>
    <section className="reports-grid"><article className="card report-trend-card"><h2>اتجاه آخر ستة أشهر</h2><div className="registered-bar-chart">{trend.map((row) => <div className="registered-bar-column" key={row.key}><div className="registered-bars"><i style={{ height: `${row.income.toNumber() / max * 100}%` }}/><b style={{ height: `${row.expense.toNumber() / max * 100}%` }}/></div><span>{monthName(row.key)}</span></div>)}</div></article><article className="card category-report-card"><h2>أعلى بنود المصروف</h2>{top.map(([name, value], index) => { const ratio = expense.gt(0) ? value.div(expense).mul(100).toNumber() : 0; return <div className="category-report-row" key={name}><b>{index + 1}</b><span><strong>{name}</strong><i><em style={{ width: `${Math.min(100, ratio)}%` }}/></i></span><span><strong>{formatSAR(value)}</strong><small>{ratio.toFixed(0)}٪</small></span></div>; })}{!top.length ? <p className="muted">أضف مصروفات لتظهر التفاصيل.</p> : null}</article></section>
  </div>;
}
