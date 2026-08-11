import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatSAR } from "@/lib/money";
import { TransactionForm } from "@/components/transaction-form";
import { AppIcon } from "@/components/app-icon";
import { deleteTransaction } from "./actions";

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; plan?: string }> }) {
  const session = await auth(); if (!session?.user.id) return null;
  const { q = "", type = "", plan = "" } = await searchParams;
  const selectedType = type === "INCOME" || type === "EXPENSE" ? type : "";
  const selectedPlan = plan === "MONTHLY" || plan === "INSTALLMENTS" ? plan : "ONCE";
  const [accounts, categories, rows] = await Promise.all([
    db.financialAccount.findMany({ where: { userId: session.user.id, isArchived: false }, orderBy: { createdAt: "asc" } }),
    db.category.findMany({ where: { userId: session.user.id }, orderBy: [{ kind: "asc" }, { name: "asc" }], select: { id: true, name: true, kind: true } }),
    db.transaction.findMany({ where: { userId: session.user.id, ...(selectedType ? { type: selectedType } : {}), ...(q ? { description: { contains: q, mode: "insensitive" } } : {}) }, include: { category: true, sourceAccount: true, destinationAccount: true }, orderBy: { occurredAt: "desc" }, take: 100 }),
  ]);
  return <div><div className="page-heading-row"><div><span className="eyebrow">سجل أموالك</span><h1>العمليات</h1><p className="muted">مرة واحدة، شهري مستمر، أو أقساط بعدد أشهر محدد.</p></div></div>
    <form className="card transaction-filters"><input className="field" name="q" defaultValue={q} placeholder="ابحث في الوصف"/><select className="field" name="type" defaultValue={selectedType}><option value="">كل العمليات</option><option value="INCOME">الدخل فقط</option><option value="EXPENSE">المصروف فقط</option></select><button className="secondary-button">بحث</button></form>
    <div className="page-grid transactions-layout"><section className="card registered-transactions">{rows.map((row) => { const income = row.type === "INCOME"; const account = income ? row.destinationAccount : row.sourceAccount; return <div className="transaction-row" key={row.id}><span className={`transaction-list-icon ${income ? "income" : "expense"}`}><AppIcon name={income ? "income" : "expense"} size={18}/></span><div className="transaction-copy"><strong>{row.description || (income ? "دخل" : "مصروف")}</strong><span>{row.category?.name || "بدون تصنيف"} · {account?.name || "بدون حساب"} · {row.occurredAt.toLocaleDateString("ar-SA")}</span></div><strong className={`number transaction-amount ${income ? "income" : "expense"}`}>{income ? "+" : "−"}{formatSAR(row.amount)}</strong><form action={deleteTransaction}><input type="hidden" name="id" value={row.id}/><button className="row-action" aria-label={`حذف ${row.description || "العملية"}`}>حذف</button></form></div>; })}{!rows.length ? <div className="panel-empty-state transactions-empty"><span><AppIcon name="transactions"/></span><strong>{q || selectedType ? "لا توجد نتائج مطابقة" : "ابدأ بإضافة أول عملية"}</strong><p>{q || selectedType ? "غيّر البحث أو نوع العملية." : "استخدم النموذج الواضح بجانب هذه القائمة، وستظهر العملية هنا فورًا."}</p></div> : null}</section><TransactionForm accounts={accounts} categories={categories} initialType={selectedType || "EXPENSE"} initialPlan={selectedPlan}/></div>
  </div>;
}
