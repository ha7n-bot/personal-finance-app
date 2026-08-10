import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatSAR } from "@/lib/money";
import { accountDelta } from "@/lib/financial/ledger";
import { addAccount, archiveAccount } from "./actions";

const labels = { BANK: "حساب بنكي", CASH: "نقدي", SAVINGS: "ادخار", INVESTMENT: "استثمار", EMERGENCY: "صندوق طوارئ" } as const;
export default async function Accounts() {
  const session = await auth(); if (!session?.user.id) redirect("/login");
  const [accounts, transactions] = await Promise.all([db.financialAccount.findMany({ where: { userId: session.user.id, isArchived: false }, orderBy: { createdAt: "asc" } }), db.transaction.findMany({ where: { userId: session.user.id, status: "POSTED" } })]);
  const total = accounts.reduce((sum, account) => sum.plus(account.openingBalance).plus(accountDelta(account.id, transactions)), new Prisma.Decimal(0));
  return <div><div className="page-heading-row"><div><span className="eyebrow">أماكن وجود أموالك</span><h1>الحسابات</h1><p className="muted">أضف البنك والنقد والادخار، ثم اختر الحساب عند تسجيل أي عملية.</p></div><div className="account-total"><span>إجمالي الأرصدة</span><strong>{formatSAR(total)}</strong></div></div>
    <div className="page-grid accounts-layout"><section className="registered-account-grid">{accounts.map((account) => { const current = account.openingBalance.plus(accountDelta(account.id, transactions)); return <article className="account-card" key={account.id}><span className="pill">{labels[account.type]}</span><p>الرصيد الحالي</p><h3>{account.name}</h3><strong className="number">{formatSAR(current)}</strong><small>رصيد البداية {formatSAR(account.openingBalance)}</small>{accounts.length > 1 ? <form action={archiveAccount}><input type="hidden" name="id" value={account.id}/><button className="text-button danger-button">أرشفة الحساب</button></form> : null}</article>; })}</section>
      <form action={addAccount} className="card transaction-form-card"><h2>إضافة حساب</h2><label className="field-label"><span>اسم الحساب</span><input className="field" name="name" placeholder="مثال: حساب الراتب" required minLength={2}/></label><label className="field-label"><span>نوع الحساب</span><select className="field" name="type" defaultValue="BANK"><option value="BANK">حساب بنكي</option><option value="CASH">نقدي</option><option value="SAVINGS">ادخار</option><option value="INVESTMENT">استثمار</option><option value="EMERGENCY">صندوق طوارئ</option></select></label><label className="field-label"><span>رصيد البداية</span><input className="field" name="balance" type="number" step="0.01" min="0" defaultValue="0"/></label><button className="btn w-full">إضافة الحساب</button></form>
    </div></div>;
}
