"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { addTransaction } from "@/app/(app)/transactions/actions";

type Kind = "INCOME" | "EXPENSE";

export function TransactionForm({ accounts, categories }: { accounts: { id: string; name: string; type: string }[]; categories: { id: string; name: string; kind: Kind }[] }) {
  const [type, setType] = useState<Kind>("EXPENSE");
  const matching = useMemo(() => categories.filter((category) => category.kind === type), [categories, type]);
  if (!accounts.length) return <aside className="card transaction-form-card empty-account-card"><span className="setup-badge">خطوة مطلوبة</span><h2>أضف حسابك أولًا</h2><p>نحتاج معرفة المكان الذي سيخرج منه المبلغ أو يدخل إليه؛ مثل البنك أو النقد.</p><Link className="btn w-full" href="/accounts">إضافة حساب الآن</Link></aside>;
  return <form action={addTransaction} className="card transaction-form-card">
    <div className="section-heading"><div><h2>عملية جديدة</h2><p>التاريخ تلقائيًا هو اليوم، ويمكن تغييره من الخيارات الإضافية.</p></div></div>
    <div className="kind-picker" role="group" aria-label="نوع العملية"><button type="button" className={type === "EXPENSE" ? "active expense" : ""} onClick={() => setType("EXPENSE")}><strong>مصروف</strong><small>مبلغ خرج من حسابي</small></button><button type="button" className={type === "INCOME" ? "active income" : ""} onClick={() => setType("INCOME")}><strong>دخل</strong><small>مبلغ دخل إلى حسابي</small></button></div>
    <input type="hidden" name="type" value={type}/>
    <label className="field-label"><span>اسم العملية <small>مثال: فاتورة الكهرباء</small></span><input className="field" name="description" required minLength={2} maxLength={140} placeholder={type === "INCOME" ? "مثال: راتب شهر أغسطس" : "مثال: فاتورة الكهرباء"}/></label>
    <label className="field-label"><span>المبلغ بالريال</span><input className="field number-input" name="amount" type="number" step="0.01" min="0.01" inputMode="decimal" required placeholder="0"/></label>
    <label className="field-label"><span>الحساب</span><select className="field" name="accountId" defaultValue={accounts[0].id} required>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label>
    <label className="field-label"><span>التصنيف</span><select className="field" name="categoryId" key={type} defaultValue={matching[0]?.id ?? ""}><option value="">بدون تصنيف</option>{matching.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
    <label className="field-label"><span>تكرار العملية</span><select className="field" name="recurrence" defaultValue="ONCE"><option value="ONCE">مرة واحدة فقط</option><option value="MONTHLY">متكررة كل شهر</option></select></label>
    <details className="optional-fields"><summary>تغيير التاريخ أو إضافة ملاحظة</summary><div className="form-stack"><label className="field-label"><span>تاريخ مختلف <small>اتركه فارغًا لاستخدام اليوم</small></span><input className="field" name="occurredAt" type="date"/></label><label className="field-label"><span>ملاحظة</span><textarea className="field textarea-field" name="notes" maxLength={500}/></label></div></details>
    <p className="form-tip"><strong>المتكررة شهريًا</strong><small>نسجل العملية الحالية ونضيف موعدها القادم تلقائيًا إلى الدفعات المتكررة.</small></p>
    <button className="btn w-full">حفظ العملية</button>
  </form>;
}
