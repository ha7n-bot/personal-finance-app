import { db } from "@/lib/db";
import { formatSAR } from "@/lib/money";
import { requireUserId } from "@/lib/current-user";
import { createRecurring, toggleRecurring } from "../financial-actions";

const frequencyLabel = { WEEKLY: "أسبوعي", MONTHLY: "شهري", QUARTERLY: "ربع سنوي", YEARLY: "سنوي", CUSTOM: "مخصص" } as const;

export default async function RecurringPage() {
  const userId = await requireUserId();
  const [rows, accounts] = await Promise.all([
    db.recurringPayment.findMany({ where: { userId }, orderBy: [{ active: "desc" }, { nextDueAt: "asc" }] }),
    db.account.findMany({ where: { userId, isArchived: false } }),
  ]);
  return <div><h1 className="text-3xl font-bold mb-2">الالتزامات القادمة</h1><p className="muted mb-8">الفواتير والاشتراكات المتكررة في مكان واحد.</p><div className="grid lg:grid-cols-[1fr_360px] gap-5"><section className="space-y-3">{rows.map(row => <article className={`card p-5 flex items-center justify-between gap-4 ${row.active ? "" : "opacity-60"}`} key={row.id}><div><strong>{row.name}</strong><p className="muted mt-1">{frequencyLabel[row.frequency]} · الاستحقاق {row.nextDueAt.toLocaleDateString("ar-SA")}</p></div><div className="text-left"><strong className="block">{formatSAR(row.amount)}</strong><form action={toggleRecurring} className="mt-2"><input type="hidden" name="id" value={row.id}/><button className="text-sm underline">{row.active ? "إيقاف" : "تفعيل"}</button></form></div></article>)}{!rows.length && <div className="card p-8 muted">لا توجد التزامات مسجلة.</div>}</section><form action={createRecurring} className="card p-6 space-y-4 h-fit"><h2 className="text-xl font-bold">التزام جديد</h2><input className="field" name="name" placeholder="الاسم" required/><input className="field" name="amount" type="number" min="1" step="0.01" placeholder="المبلغ" required/><input className="field" name="nextDueAt" type="date" required/><select className="field" name="frequency"><option value="MONTHLY">شهري</option><option value="WEEKLY">أسبوعي</option><option value="QUARTERLY">ربع سنوي</option><option value="YEARLY">سنوي</option></select><select className="field" name="accountId"><option value="">بدون حساب</option>{accounts.map(account => <option value={account.id} key={account.id}>{account.name}</option>)}</select><button className="btn w-full">إضافة</button></form></div></div>;
}
