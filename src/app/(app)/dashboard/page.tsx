import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { AppIcon, type AppIconName } from "@/components/app-icon";
import { db } from "@/lib/db";
import { nextInstallmentAmount } from "@/lib/installments";
import { formatSAR } from "@/lib/money";
import { accountDelta, spendingTotal } from "@/lib/financial/ledger";
import { ensureUserWorkspace } from "@/lib/bootstrap-user";

const metricIcons: AppIconName[] = ["accounts", "income", "expense", "reports"];
const metricTones = ["emerald", "blue", "rose", "gold"];

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { month: "short" }).format(new Date(year, month - 1, 1));
}

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user.id) redirect("/login");
  await ensureUserWorkspace(session.user.id);

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { accounts: { where: { isArchived: false }, orderBy: { createdAt: "asc" } } },
  });
  if (!user?.onboardingCompleted) redirect("/onboarding");

  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const sixMonthsStart = new Date(monthStart);
  sixMonthsStart.setMonth(sixMonthsStart.getMonth() - 5);
  const nextThirtyDays = new Date();
  nextThirtyDays.setDate(nextThirtyDays.getDate() + 30);

  const [transactions, upcoming] = await Promise.all([
    db.transaction.findMany({ where: { userId: user.id, status: "POSTED" }, include: { category: true, sourceAccount: true, destinationAccount: true }, orderBy: { occurredAt: "desc" } }),
    db.recurringPayment.findMany({ where: { userId: user.id, active: true, nextDueAt: { lte: nextThirtyDays } }, orderBy: { nextDueAt: "asc" }, take: 5 }),
  ]);

  const month = transactions.filter((row) => row.occurredAt >= monthStart);
  const income = month.filter((row) => row.type === "INCOME").reduce((sum, row) => sum.plus(row.amount), new Prisma.Decimal(0));
  const expenses = spendingTotal(month);
  const net = income.minus(expenses);
  const balance = user.accounts.reduce((sum, account) => sum.plus(account.openingBalance).plus(accountDelta(account.id, transactions)), new Prisma.Decimal(0));
  const rate = income.gt(0) ? net.div(income).mul(100) : new Prisma.Decimal(0);
  const cards = [
    ["إجمالي الرصيد", formatSAR(balance), `${user.accounts.length} حساب`],
    ["دخل هذا الشهر", formatSAR(income), `${month.filter((row) => row.type === "INCOME").length} عملية`],
    ["مصروف هذا الشهر", formatSAR(expenses), `${month.filter((row) => row.type === "EXPENSE").length} عملية`],
    ["صافي الشهر", formatSAR(net), income.gt(0) ? `فائض ${rate.toDecimalPlaces(0)}٪` : "أضف دخلك لحساب النسبة"],
  ];

  const keys = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(monthStart);
    date.setMonth(date.getMonth() - 5 + index);
    return monthKey(date);
  });
  const trend = keys.map((key) => {
    const rows = transactions.filter((row) => row.occurredAt >= sixMonthsStart && monthKey(row.occurredAt) === key);
    return {
      key,
      income: rows.filter((row) => row.type === "INCOME").reduce((sum, row) => sum.plus(row.amount), new Prisma.Decimal(0)),
      expense: spendingTotal(rows),
    };
  });
  const trendMax = Math.max(1, ...trend.flatMap((row) => [row.income.toNumber(), row.expense.toNumber()]));

  const categoryTotals = new Map<string, Prisma.Decimal>();
  month.filter((row) => row.type === "EXPENSE").forEach((row) => {
    const name = row.category?.name || "بدون تصنيف";
    categoryTotals.set(name, (categoryTotals.get(name) || new Prisma.Decimal(0)).plus(row.amount));
  });
  const topCategories = [...categoryTotals].sort((a, b) => b[1].cmp(a[1])).slice(0, 4);
  const topRatio = expenses.gt(0) && topCategories[0] ? topCategories[0][1].div(expenses).mul(100).toNumber() : 0;
  const hasTransactions = transactions.length > 0;

  return <div>
    <section className="dashboard-hero">
      <div className="dashboard-hero-copy"><span className="eyebrow">لوحتك المالية</span><h1>أهلًا، {user.name || "بك"}</h1><p>كل تغيير تحفظه هنا يبقى مرتبطًا بحسابك، وتستطيع الرجوع إليه من الجوال أو الويب.</p><div className="dashboard-cloud-status"><AppIcon name="cloud" size={18}/><span><strong>الحفظ السحابي نشط</strong><small>لا تحتاج زر حفظ أو نسخة احتياطية يدوية</small></span></div></div>
      <div className="dashboard-hero-balance"><span>رصيدك الإجمالي الآن</span><strong className="number">{formatSAR(balance)}</strong><small>آخر تحديث مع فتح هذه الصفحة</small><Link href="/transactions?type=EXPENSE"><AppIcon name="plus" size={17}/>إضافة عملية</Link></div>
    </section>

    {!hasTransactions ? <section className="card first-run-guide">
      <div className="first-run-heading"><span className="setup-badge">ابدأ من هنا</span><h2>ثلاث خطوات وستصبح الصورة واضحة</h2><p>لا تحتاج تعبئة كل أقسام التطبيق. سجّل أهم الأشياء أولًا والباقي سيظهر تلقائيًا.</p></div>
      <div className="first-run-steps">
        <div className="done"><b><AppIcon name="check"/></b><span><strong>١. الحساب جاهز</strong><small>{user.accounts[0]?.name || "الحساب الرئيسي"}</small></span></div>
        <Link href="/transactions?type=INCOME"><b><AppIcon name="income"/></b><span><strong>٢. أضف دخلك</strong><small>مثلاً الراتب الشهري</small></span><AppIcon name="arrow" size={17}/></Link>
        <Link href="/transactions?type=EXPENSE"><b><AppIcon name="expense"/></b><span><strong>٣. أضف أول مصروف</strong><small>مثلاً فاتورة الكهرباء</small></span><AppIcon name="arrow" size={17}/></Link>
      </div>
      <p className="first-run-tip"><AppIcon name="repeat" size={18}/><span>عند إضافة مصروف اختر: مرة واحدة، شهري مستمر، أو أقساط محددة. <Link href="/settings">الخط غير مناسب؟ اضبطه من الإعدادات.</Link></span></p>
    </section> : <nav className="quick-actions" aria-label="إجراءات سريعة"><Link href="/transactions?type=EXPENSE"><span className="rose"><AppIcon name="expense"/></span><b>إضافة مصروف</b></Link><Link href="/transactions?type=INCOME"><span className="emerald"><AppIcon name="income"/></span><b>إضافة دخل</b></Link><Link href="/transactions?type=EXPENSE&plan=MONTHLY"><span className="gold"><AppIcon name="repeat"/></span><b>فاتورة أو قسط</b></Link><Link href="/reports"><span className="blue"><AppIcon name="reports"/></span><b>فتح التقارير</b></Link></nav>}

    <section className="registered-metric-grid">{cards.map(([label, value, hint], index) => <article className={`card registered-metric metric-${metricTones[index]}`} key={label}><div><span>{label}</span><i><AppIcon name={metricIcons[index]}/></i></div><strong className="number">{value}</strong><small>{hint}</small></article>)}</section>

    <section className="dashboard-insights-grid">
      <article className="card dashboard-trend-panel"><div className="panel-heading"><div><span className="eyebrow">الاتجاه المالي</span><h2>الدخل والمصروف خلال ٦ أشهر</h2></div><div className="chart-legend"><span><i className="income-dot"/>دخل</span><span><i className="expense-dot"/>مصروف</span></div></div>
        <div className="dashboard-bar-chart" aria-label="مخطط الدخل والمصروف خلال ستة أشهر">{trend.map((row) => <div className="dashboard-bar-column" key={row.key}><div className="dashboard-bars"><i title={`الدخل ${formatSAR(row.income)}`} style={{ height: `${Math.max(row.income.gt(0) ? 5 : 1, row.income.toNumber() / trendMax * 100)}%` }}/><b title={`المصروف ${formatSAR(row.expense)}`} style={{ height: `${Math.max(row.expense.gt(0) ? 5 : 1, row.expense.toNumber() / trendMax * 100)}%` }}/></div><span>{monthLabel(row.key)}</span></div>)}</div>
        {!hasTransactions ? <p className="chart-empty-note">سيبدأ المخطط بالحركة بعد إضافة أول عملية.</p> : null}
      </article>

      <article className="card category-insight-panel"><div className="panel-heading"><div><span className="eyebrow">هذا الشهر</span><h2>أين يذهب المصروف؟</h2></div><Link href="/reports">التفاصيل</Link></div>
        {topCategories.length ? <><div className="category-ring-wrap"><div className="category-ring" style={{ background: `conic-gradient(var(--danger) ${Math.min(100, topRatio)}%, var(--accent-soft) 0)` }}><span><strong>{topRatio.toFixed(0)}٪</strong><small>أعلى بند</small></span></div><div><strong>{topCategories[0][0]}</strong><small>{formatSAR(topCategories[0][1])}</small></div></div><div className="dashboard-category-list">{topCategories.map(([name, value]) => <div key={name}><span>{name}</span><strong>{formatSAR(value)}</strong></div>)}</div></> : <div className="panel-empty-state"><span><AppIcon name="reports"/></span><strong>لا توجد مصروفات بعد</strong><p>أضف مصروفًا واحدًا وسترى توزيعه هنا.</p></div>}
      </article>

      <article className="card dashboard-panel recent-panel"><div className="panel-heading"><h2>آخر العمليات</h2><Link href="/transactions">عرض الكل</Link></div>{transactions.slice(0, 5).map((row) => { const isIncome = row.type === "INCOME"; const account = isIncome ? row.destinationAccount : row.sourceAccount; return <div className="dashboard-line" key={row.id}><span className={`dashboard-line-icon ${isIncome ? "income" : "expense"}`}><AppIcon name={isIncome ? "income" : "expense"} size={18}/></span><span><strong>{row.description || "عملية"}</strong><small>{row.category?.name || "بدون تصنيف"} · {account?.name || "الحساب الرئيسي"} · {row.occurredAt.toLocaleDateString("ar-SA")}</small></span><strong className={isIncome ? "positive" : "negative"}>{isIncome ? "+" : "−"}{formatSAR(row.amount)}</strong></div>})}{!hasTransactions ? <div className="panel-empty-state compact"><strong>سجلك ما زال فارغًا</strong><p>ابدأ من خطوات الإعداد الموجودة أعلى الصفحة.</p></div> : null}</article>

      <article className="card dashboard-panel upcoming-panel"><div className="panel-heading"><h2>الاستحقاقات القادمة</h2><Link href="/recurring">إدارة</Link></div>{upcoming.map((row) => { const fixed = row.planType === "INSTALLMENTS" && row.totalAmount !== null && row.installmentCount !== null; const nextAmount = fixed ? nextInstallmentAmount(row.totalAmount!, row.installmentCount!, row.completedInstallments) : row.amount; return <div className="dashboard-line" key={row.id}><span className="dashboard-line-icon due"><AppIcon name={fixed ? "debt" : "calendar"} size={18}/></span><span><strong>{row.name}</strong><small>{row.nextDueAt.toLocaleDateString("ar-SA")} · {fixed ? `قسط ${row.completedInstallments + 1} من ${row.installmentCount}` : "شهري مستمر"}</small></span><strong>{formatSAR(nextAmount)}</strong></div>; })}{!upcoming.length ? <div className="panel-empty-state compact"><strong>لا توجد فواتير قريبة</strong><p>أضف فاتورة شهرية أو خطة أقساط وستظهر هنا تلقائيًا.</p></div> : null}</article>
    </section>
  </div>;
}
