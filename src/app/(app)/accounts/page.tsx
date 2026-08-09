import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatSAR } from "@/lib/money";
import { addAccount, archiveAccount } from "./actions";

export default async function Accounts() {
  const session = await auth();
  const accounts = await db.account.findMany({ where: { userId: session!.user.id, isArchived: false }, orderBy: { createdAt: "asc" } });
  return <div><h1 className="text-3xl font-bold mb-2">الحسابات</h1><p className="muted mb-8">حساباتك البنكية والنقدية بالريال السعودي.</p><div className="grid lg:grid-cols-[1fr_360px] gap-5"><section className="grid sm:grid-cols-2 gap-4">{accounts.map((account) => <article className="card p-6" key={account.id}><p className="muted">{account.type === "BANK" ? "حساب بنكي" : "نقدي"}</p><h2 className="font-bold text-xl my-2">{account.name}</h2><strong>{formatSAR(account.openingBalance)}</strong><form action={archiveAccount} className="mt-4"><input type="hidden" name="id" value={account.id}/><button className="text-sm text-red-600">أرشفة الحساب</button></form></article>)}</section><form action={addAccount} className="card p-6 space-y-4 h-fit"><h2 className="font-bold text-xl">حساب جديد</h2><input className="field" name="name" placeholder="اسم الحساب" required/><select className="field" name="type"><option value="BANK">حساب بنكي</option><option value="CASH">نقدي</option></select><input className="field" name="balance" type="number" step="0.01" min="0" placeholder="الرصيد الافتتاحي"/><button className="btn w-full">إضافة</button></form></div></div>;
}
