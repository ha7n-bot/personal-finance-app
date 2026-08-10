import Link from "next/link";
import { db } from "@/lib/db";
import { formatSAR } from "@/lib/money";
import { requireUserId } from "@/lib/current-user";
import { createRecurring, toggleRecurring } from "../financial-actions";

const frequencyLabel = { WEEKLY: "أسبوعي", MONTHLY: "شهري", QUARTERLY: "كل ثلاثة أشهر", YEARLY: "سنوي", CUSTOM: "مخصص" } as const;
export default async function RecurringPage() {
  const userId = await requireUserId();
  const [rows, accounts, categories] = await Promise.all([
    db.recurringPayment.findMany({ where: { userId }, include: { account: true, category: true }, orderBy: [{ active: "desc" }, { nextDueAt: "asc" }] }),
    db.financialAccount.findMany({ where: { userId, isArchived: false }, orderBy: { createdAt: "asc" } }),
    db.category.findMany({ where: { userId, kind: "EXPENSE" }, orderBy: { name: "asc" } }),
  ]);
  return <div><div className="page-heading-row"><div><span className="eyebrow">فواتير وأقساط</span><h1>الدفعات المتكررة</h1><p className="muted">تابع ما يتكرر عليك وموعد الدفعة القادمة.</p></div><Link className="secondary-button" href="/transactions">تسجيل عملية عادية</Link></div>
    <div className="page-grid recurring-layout"><section className="recurring-list">{rows.map((row) => <article className={`card recurring-card ${row.active ? "" : "paused"}`} key={row.id}><div className="recurring-main"><span className="recurring-type expense">مصروف</span><div><h2>{row.name}</h2><p>{frequencyLabel[row.frequency]} · الاستحقاق القادم {row.nextDueAt.toLocaleDateString("ar-SA")}</p><small>{row.account?.name || "بدون حساب"}{row.category ? ` · ${row.category.name}` : ""}</small></div></div><div className="recurring-actions"><strong>{formatSAR(row.amount)}</strong><form action={toggleRecurring}><input type="hidden" name="id" value={row.id}/><button className="text-button">{row.active ? "إيقاف مؤقت" : "إعادة التفعيل"}</button></form></div></article>)}{!rows.length ? <div className="card empty"><strong>لا توجد دفعات متكررة</strong><p>اختر «متكررة كل شهر» عند تسجيل فاتورة لتظهر هنا.</p></div> : null}</section>
      {accounts.length ? <form action={createRecurring} className="card transaction-form-card"><h2>إضافة التزام متكرر</h2><input type="hidden" name="transactionType" value="EXPENSE"/><label className="field-label"><span>اسم الالتزام</span><input className="field" name="name" placeholder="مثال: فاتورة الكهرباء" required minLength={2}/></label><label className="field-label"><span>المبلغ المتوقع</span><input className="field" name="amount" type="number" min="0.01" step="0.01" required/></label><label className="field-label"><span>طريقة التكرار</span><select className="field" name="frequency" defaultValue="MONTHLY"><option value="MONTHLY">كل شهر</option><option value="WEEKLY">كل أسبوع</option><option value="QUARTERLY">كل ثلاثة أشهر</option><option value="YEARLY">كل سنة</option></select></label><label className="field-label"><span>موعد الاستحقاق القادم</span><input className="field" name="nextDueAt" type="date" required/></label><label className="field-label"><span>الحساب</span><select className="field" name="accountId" defaultValue={accounts[0].id}>{accounts.map((a) => <option value={a.id} key={a.id}>{a.name}</option>)}</select></label><label className="field-label"><span>التصنيف</span><select className="field" name="categoryId" defaultValue={categories[0]?.id ?? ""}><option value="">بدون تصنيف</option>{categories.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label><button className="btn w-full">إضافة الالتزام</button></form> : <aside className="card empty-account-card"><h2>أضف حسابًا أولًا</h2><Link className="btn" href="/accounts">إضافة حساب</Link></aside>}
    </div></div>;
}
