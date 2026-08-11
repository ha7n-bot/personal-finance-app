"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { addTransaction, type TransactionActionState } from "@/app/(app)/transactions/actions";
import { AppIcon } from "@/components/app-icon";

type Kind = "INCOME" | "EXPENSE";
const initialState: TransactionActionState = { status: "idle", message: "" };

export function TransactionForm({ accounts, categories, initialType = "EXPENSE" }: { accounts: { id: string; name: string; type: string }[]; categories: { id: string; name: string; kind: Kind }[]; initialType?: Kind }) {
  const [type, setType] = useState<Kind>(initialType);
  const [recurrence, setRecurrence] = useState<"ONCE" | "MONTHLY">("ONCE");
  const [state, formAction, pending] = useActionState(addTransaction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const matching = useMemo(() => categories.filter((category) => category.kind === type), [categories, type]);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setRecurrence("ONCE");
    }
  }, [state]);

  if (!accounts.length) return <aside className="card transaction-form-card empty-account-card"><span className="setup-badge">خطوة مطلوبة</span><span className="empty-account-icon"><AppIcon name="accounts"/></span><h2>أضف حسابك أولًا</h2><p>الحساب هو المكان الذي سيخرج منه المبلغ أو يدخل إليه، مثل البنك أو النقد.</p><Link className="btn w-full" href="/accounts">إضافة حساب الآن</Link></aside>;

  return <form ref={formRef} action={formAction} className="card transaction-form-card">
    <div className="section-heading"><div><span className="eyebrow">نموذج مبسّط</span><h2>عملية جديدة</h2><p>أدخل الاسم والمبلغ فقط، والباقي جاهز باختيارات واضحة.</p></div></div>

    <div className="kind-picker" role="group" aria-label="نوع العملية">
      <button type="button" className={type === "EXPENSE" ? "active expense" : ""} onClick={() => setType("EXPENSE")}><AppIcon name="expense"/><span><strong>مصروف</strong><small>مبلغ خرج من حسابي</small></span></button>
      <button type="button" className={type === "INCOME" ? "active income" : ""} onClick={() => setType("INCOME")}><AppIcon name="income"/><span><strong>دخل</strong><small>مبلغ دخل إلى حسابي</small></span></button>
    </div>
    <input type="hidden" name="type" value={type}/>

    <label className="field-label"><span>ما اسم العملية؟ <small>اكتب اسمًا تعرفه بسرعة</small></span><input className="field" name="description" required minLength={2} maxLength={140} placeholder={type === "INCOME" ? "مثال: راتب شهر أغسطس" : "مثال: فاتورة الكهرباء"}/></label>
    <label className="field-label"><span>كم المبلغ؟</span><div className="amount-field"><input className="field number-input" name="amount" type="number" step="0.01" min="0.01" inputMode="decimal" required placeholder="0"/><b>ر.س</b></div></label>

    <div className="transaction-two-columns">
      <label className="field-label"><span>من أي حساب؟</span><select className="field" name="accountId" defaultValue={accounts[0].id} required>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label>
      <label className="field-label"><span>التصنيف</span><select className="field" name="categoryId" key={type} defaultValue={matching[0]?.id ?? ""}><option value="">بدون تصنيف</option>{matching.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
    </div>

    <fieldset className="recurrence-picker"><legend>هل ستتكرر؟</legend>
      <label><input type="radio" name="recurrence" value="ONCE" checked={recurrence === "ONCE"} onChange={() => setRecurrence("ONCE")}/><span><AppIcon name="check"/><strong>مرة واحدة</strong><small>تُسجل اليوم وتنتهي</small></span></label>
      <label><input type="radio" name="recurrence" value="MONTHLY" checked={recurrence === "MONTHLY"} onChange={() => setRecurrence("MONTHLY")}/><span><AppIcon name="repeat"/><strong>كل شهر</strong><small>مثل الكهرباء والاشتراكات</small></span></label>
    </fieldset>

    {recurrence === "MONTHLY" ? <p className="form-tip monthly"><AppIcon name="calendar" size={18}/><span><strong>سننشئ الموعد القادم تلقائيًا</strong><small>تجد الفاتورة لاحقًا في صفحة الدفعات المتكررة ويمكنك إيقافها متى أردت.</small></span></p> : null}

    <details className="optional-fields"><summary><AppIcon name="settings" size={17}/>تغيير التاريخ أو إضافة ملاحظة <small>اختياري</small></summary><div className="form-stack"><label className="field-label"><span>تاريخ مختلف <small>اتركه فارغًا لاستخدام اليوم</small></span><input className="field" name="occurredAt" type="date"/></label><label className="field-label"><span>ملاحظة</span><textarea className="field textarea-field" name="notes" maxLength={500} placeholder="أي تفاصيل تريد تذكرها لاحقًا"/></label></div></details>

    {state.message ? <p className={`form-result ${state.status}`} role={state.status === "error" ? "alert" : "status"}><AppIcon name={state.status === "success" ? "check" : "info"} size={18}/>{state.message}</p> : null}
    <button className="btn w-full" disabled={pending}>{pending ? "جارٍ الحفظ…" : <><AppIcon name="cloud" size={18}/>حفظ العملية في حسابي</>}</button>
  </form>;
}
