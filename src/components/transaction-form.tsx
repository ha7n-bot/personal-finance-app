"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { addTransaction, type TransactionActionState } from "@/app/(app)/transactions/actions";
import { AppIcon } from "@/components/app-icon";

type Kind = "INCOME" | "EXPENSE";
export type PaymentPlan = "ONCE" | "MONTHLY" | "INSTALLMENTS";

const initialState: TransactionActionState = { status: "idle", message: "" };
const sar = new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 2 });

type Props = {
  accounts: { id: string; name: string; type: string }[];
  categories: { id: string; name: string; kind: Kind }[];
  initialType?: Kind;
  initialPlan?: PaymentPlan;
};

export function TransactionForm({ accounts, categories, initialType = "EXPENSE", initialPlan = "ONCE" }: Props) {
  const safeInitialPlan = initialType === "INCOME" && initialPlan === "INSTALLMENTS" ? "ONCE" : initialPlan;
  const [type, setType] = useState<Kind>(initialType);
  const [plan, setPlan] = useState<PaymentPlan>(safeInitialPlan);
  const [totalAmount, setTotalAmount] = useState("");
  const [installmentCount, setInstallmentCount] = useState("");
  const [state, formAction, pending] = useActionState(addTransaction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const matching = useMemo(() => categories.filter((category) => category.kind === type), [categories, type]);
  const preview = useMemo(() => {
    const total = Number(totalAmount);
    const count = Number(installmentCount);
    if (!Number.isFinite(total) || total <= 0 || !Number.isInteger(count) || count < 2) return null;
    return { first: Math.round(total / count * 100) / 100, count, total };
  }, [installmentCount, totalAmount]);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setPlan("ONCE");
      setTotalAmount("");
      setInstallmentCount("");
    }
  }, [state]);

  function chooseType(nextType: Kind) {
    setType(nextType);
    if (nextType === "INCOME" && plan === "INSTALLMENTS") setPlan("ONCE");
  }

  if (!accounts.length) return <aside className="card transaction-form-card empty-account-card"><span className="setup-badge">خطوة مطلوبة</span><span className="empty-account-icon"><AppIcon name="accounts"/></span><h2>أضف حسابك أولًا</h2><p>الحساب هو المكان الذي سيخرج منه المبلغ أو يدخل إليه، مثل البنك أو النقد.</p><Link className="btn w-full" href="/accounts">إضافة حساب الآن</Link></aside>;

  return <form ref={formRef} action={formAction} className="card transaction-form-card">
    <div className="section-heading"><div><span className="eyebrow">إضافة سهلة</span><h2>عملية جديدة</h2><p>اختر نوعها، واكتب المبلغ. التاريخ يُسجل تلقائيًا.</p></div></div>

    <div className="kind-picker" role="group" aria-label="نوع العملية">
      <button type="button" className={type === "EXPENSE" ? "active expense" : ""} onClick={() => chooseType("EXPENSE")}><AppIcon name="expense"/><span><strong>مصروف</strong><small>مبلغ خرج من حسابي</small></span></button>
      <button type="button" className={type === "INCOME" ? "active income" : ""} onClick={() => chooseType("INCOME")}><AppIcon name="income"/><span><strong>دخل</strong><small>مبلغ دخل إلى حسابي</small></span></button>
    </div>
    <input type="hidden" name="type" value={type}/>
    <input type="hidden" name="plan" value={plan}/>

    <label className="field-label"><span>ما اسم العملية؟ <small>اسم واضح تتعرف عليه لاحقًا</small></span><input className="field" name="description" required minLength={2} maxLength={140} placeholder={type === "INCOME" ? "مثال: راتب شهر أغسطس" : "مثال: فاتورة الكهرباء"}/></label>

    <fieldset className="payment-plan-picker"><legend>{type === "INCOME" ? "هل هذا الدخل مرة واحدة أم شهري؟" : "كيف ستدفع هذا المصروف؟"}</legend>
      <label><input type="radio" checked={plan === "ONCE"} onChange={() => setPlan("ONCE")}/><span><AppIcon name="check"/><strong>مرة واحدة</strong><small>شراء أو دفعة تنتهي اليوم</small></span></label>
      <label><input type="radio" checked={plan === "MONTHLY"} onChange={() => setPlan("MONTHLY")}/><span><AppIcon name="repeat"/><strong>شهري مستمر</strong><small>{type === "INCOME" ? "مثل الراتب الشهري" : "مثل الكهرباء أو الاشتراك"}</small></span></label>
      {type === "EXPENSE" ? <label><input type="radio" checked={plan === "INSTALLMENTS"} onChange={() => setPlan("INSTALLMENTS")}/><span><AppIcon name="debt"/><strong>أقساط محددة</strong><small>إجمالي موزع على عدد أشهر</small></span></label> : null}
    </fieldset>

    {plan === "INSTALLMENTS" ? <div className="installment-fields">
      <div className="transaction-two-columns">
        <label className="field-label"><span>إجمالي قيمة الأقساط</span><div className="amount-field"><input className="field number-input" name="totalAmount" type="number" step="0.01" min="0.01" inputMode="decimal" required value={totalAmount} onChange={(event) => setTotalAmount(event.target.value)} placeholder="مثال: 1200"/><b>ر.س</b></div></label>
        <label className="field-label"><span>عدد الأشهر</span><input className="field number-input" name="installmentCount" type="number" min="2" max="120" step="1" inputMode="numeric" required value={installmentCount} onChange={(event) => setInstallmentCount(event.target.value)} placeholder="مثال: 3"/></label>
      </div>
      {preview ? <p className="installment-preview"><AppIcon name="info" size={18}/><span><strong>القسط الأول نحو {sar.format(preview.first)}</strong><small>سنسجله الآن، ثم نتابع {preview.count - 1} قسطًا تلقائيًا حتى يكتمل إجمالي {sar.format(preview.total)}.</small></span></p> : <p className="field-help">أدخل الإجمالي وعدد الأشهر وسنحسب قيمة كل قسط والمتبقي تلقائيًا.</p>}
    </div> : <label className="field-label"><span>{plan === "MONTHLY" ? "قيمة الدفعة الشهرية" : "كم المبلغ؟"}</span><div className="amount-field"><input className="field number-input" name="amount" type="number" step="0.01" min="0.01" inputMode="decimal" required placeholder="0"/><b>ر.س</b></div></label>}

    <div className="transaction-two-columns">
      <label className="field-label"><span>{type === "INCOME" ? "إلى أي حساب؟" : "من أي حساب؟"}</span><select className="field" name="accountId" defaultValue={accounts[0].id} required>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label>
      <label className="field-label"><span>التصنيف</span><select className="field" name="categoryId" key={type} defaultValue={matching[0]?.id ?? ""}><option value="">بدون تصنيف</option>{matching.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
    </div>

    {plan === "MONTHLY" ? <p className="form-tip monthly"><AppIcon name="calendar" size={18}/><span><strong>لا تحتاج اختيار تاريخ</strong><small>تُسجل دفعة اليوم، ويُحدد موعد الشهر القادم تلقائيًا ويمكنك إيقافها لاحقًا.</small></span></p> : null}

    <details className="optional-fields"><summary><AppIcon name="settings" size={17}/>تفاصيل إضافية <small>اختياري</small></summary><div className="form-stack"><label className="field-label"><span>تغيير تاريخ التسجيل <small>اتركه فارغًا لاستخدام اليوم</small></span><input className="field" name="occurredAt" type="date"/></label><label className="field-label"><span>ملاحظة</span><textarea className="field textarea-field" name="notes" maxLength={500} placeholder="أي تفاصيل تريد تذكرها لاحقًا"/></label></div></details>

    {state.message ? <p className={`form-result ${state.status}`} role={state.status === "error" ? "alert" : "status"}><AppIcon name={state.status === "success" ? "check" : "info"} size={18}/>{state.message}</p> : null}
    <button className="btn w-full" disabled={pending}>{pending ? "جارٍ الحفظ…" : <><AppIcon name="cloud" size={18}/>{plan === "INSTALLMENTS" ? "تسجيل القسط الأول وحفظ الخطة" : plan === "MONTHLY" ? "تسجيل اليوم وتفعيل الشهري" : "حفظ العملية مرة واحدة"}</>}</button>
  </form>;
}
