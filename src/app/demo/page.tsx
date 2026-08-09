"use client";

import { FormEvent, useMemo, useState } from "react";

type Tab = "dashboard" | "accounts" | "transactions" | "budgets" | "reports";
type Account = { id: number; name: string; type: "بنكي" | "نقدي"; opening: number };
type Transaction = { id: number; title: string; amount: number; type: "income" | "expense"; category: string; accountId: number; date: string };
type Budget = { category: string; amount: number };

const sar = (value: number) => new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR" }).format(value);
const today = new Date().toISOString().slice(0, 10);

const initialAccounts: Account[] = [{ id: 1, name: "الحساب الرئيسي", type: "بنكي", opening: 8450 }, { id: 2, name: "المحفظة", type: "نقدي", opening: 600 }];
const initialTransactions: Transaction[] = [
  { id: 1, title: "الراتب", amount: 12000, type: "income", category: "دخل", accountId: 1, date: today },
  { id: 2, title: "إيجار المنزل", amount: 2800, type: "expense", category: "سكن", accountId: 1, date: today },
  { id: 3, title: "مشتريات غذائية", amount: 430, type: "expense", category: "طعام", accountId: 2, date: today },
  { id: 4, title: "بنزين", amount: 180, type: "expense", category: "نقل", accountId: 2, date: today },
];

export default function DemoPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [accounts, setAccounts] = useState(initialAccounts);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [categories, setCategories] = useState(["دخل", "سكن", "طعام", "نقل", "تسوق", "ترفيه"]);
  const [budgets, setBudgets] = useState<Budget[]>([{ category: "طعام", amount: 1200 }, { category: "نقل", amount: 700 }, { category: "ترفيه", amount: 500 }]);

  const accountBalance = (account: Account) => account.opening + transactions.filter(item => item.accountId === account.id).reduce((sum, item) => sum + (item.type === "income" ? item.amount : -item.amount), 0);
  const income = transactions.filter(item => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expenses = transactions.filter(item => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const totalBalance = accounts.reduce((sum, account) => sum + accountBalance(account), 0);
  const categorySpend = useMemo(() => transactions.filter(item => item.type === "expense").reduce<Record<string, number>>((result, item) => ({ ...result, [item.category]: (result[item.category] || 0) + item.amount }), {}), [transactions]);

  function addAccount(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); setAccounts(items => [...items, { id: Date.now(), name: String(data.get("name")), type: String(data.get("type")) as Account["type"], opening: Number(data.get("opening")) }]); event.currentTarget.reset(); }
  function addTransaction(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); setTransactions(items => [{ id: Date.now(), title: String(data.get("title")), amount: Number(data.get("amount")), type: String(data.get("type")) as Transaction["type"], category: String(data.get("category")), accountId: Number(data.get("accountId")), date: String(data.get("date")) }, ...items]); event.currentTarget.reset(); }
  function addBudget(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); const category = String(data.get("category")); setBudgets(items => [...items.filter(item => item.category !== category), { category, amount: Number(data.get("amount")) }]); }
  function addCategory(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); const name = String(data.get("name")).trim(); if (name && !categories.includes(name)) setCategories(items => [...items, name]); event.currentTarget.reset(); }

  const nav: [Tab, string][] = [["dashboard", "الرئيسية"], ["accounts", "الحسابات"], ["transactions", "العمليات"], ["budgets", "الميزانية"], ["reports", "التقارير"]];
  return <div className="min-h-screen md:grid md:grid-cols-[230px_1fr]">
    <aside className="hidden md:flex flex-col p-5 border-l" style={{ background: "var(--card)", borderColor: "var(--line)" }}><h1 className="text-2xl font-black mb-2">مالي</h1><p className="muted text-sm mb-8">تجربة كاملة — SAR</p><nav className="space-y-2">{nav.map(([id, label]) => <button className={`w-full text-right rounded-xl px-4 py-3 ${tab === id ? "bg-teal-700 text-white" : "hover:bg-black/5"}`} onClick={() => setTab(id)} key={id}>{label}</button>)}</nav></aside>
    <main className="p-5 pb-24 md:p-10 min-w-0">
      <div className="flex justify-between items-center gap-4 mb-8"><div><p className="muted">نسخة تجريبية تفاعلية</p><h1 className="text-3xl font-bold">{nav.find(item => item[0] === tab)?.[1]}</h1></div><span className="rounded-full px-4 py-2 text-sm bg-emerald-500/10 text-emerald-700">الريال السعودي</span></div>

      {tab === "dashboard" && <><section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{[["إجمالي الرصيد", totalBalance], ["إجمالي الدخل", income], ["إجمالي المصروف", expenses], ["المتبقي", income - expenses]].map(([label, value]) => <article className="card p-5" key={String(label)}><p className="muted">{String(label)}</p><strong className="text-2xl block mt-3">{sar(Number(value))}</strong></article>)}</section><section className="grid lg:grid-cols-2 gap-5 mt-6"><article className="card p-6"><h2 className="font-bold text-xl mb-4">الحسابات</h2>{accounts.map(account => <div className="flex justify-between py-3 border-b" style={{ borderColor: "var(--line)" }} key={account.id}><span>{account.name}</span><strong>{sar(accountBalance(account))}</strong></div>)}</article><article className="card p-6"><h2 className="font-bold text-xl mb-4">أحدث العمليات</h2>{transactions.slice(0, 5).map(item => <div className="flex justify-between py-3 border-b" style={{ borderColor: "var(--line)" }} key={item.id}><span>{item.title}</span><strong className={item.type === "income" ? "text-emerald-600" : ""}>{item.type === "income" ? "+" : "-"}{sar(item.amount)}</strong></div>)}</article></section></>}

      {tab === "accounts" && <div className="grid lg:grid-cols-[1fr_360px] gap-5"><section className="grid sm:grid-cols-2 gap-4">{accounts.map(account => <article className="card p-6" key={account.id}><p className="muted">{account.type}</p><h2 className="font-bold text-xl my-2">{account.name}</h2><strong className="text-2xl">{sar(accountBalance(account))}</strong><button onClick={() => setAccounts(items => items.filter(item => item.id !== account.id))} className="block text-sm text-red-600 mt-5">أرشفة الحساب</button></article>)}</section><form onSubmit={addAccount} className="card p-6 space-y-4 h-fit"><h2 className="font-bold text-xl">حساب جديد</h2><input className="field" name="name" placeholder="اسم الحساب" required/><select className="field" name="type"><option>بنكي</option><option>نقدي</option></select><input className="field" name="opening" type="number" min="0" step="0.01" placeholder="الرصيد الافتتاحي" required/><button className="btn w-full">إضافة الحساب</button></form></div>}

      {tab === "transactions" && <div className="grid lg:grid-cols-[1fr_380px] gap-5"><section className="card p-6">{transactions.map(item => <div className="flex justify-between items-center py-4 border-b" style={{ borderColor: "var(--line)" }} key={item.id}><div><strong>{item.title}</strong><p className="muted text-sm">{item.category} · {item.date}</p></div><div className="text-left"><strong className={item.type === "income" ? "text-emerald-600" : ""}>{item.type === "income" ? "+" : "-"}{sar(item.amount)}</strong><button onClick={() => setTransactions(items => items.filter(row => row.id !== item.id))} className="block text-xs text-red-600 mt-1">حذف</button></div></div>)}</section><form onSubmit={addTransaction} className="card p-6 space-y-4 h-fit"><h2 className="font-bold text-xl">عملية جديدة</h2><select className="field" name="type"><option value="expense">مصروف</option><option value="income">دخل</option></select><input className="field" name="amount" type="number" min="0.01" step="0.01" placeholder="المبلغ" required/><input className="field" name="title" placeholder="الوصف" required/><input className="field" name="date" type="date" defaultValue={today} required/><select className="field" name="accountId">{accounts.map(account => <option value={account.id} key={account.id}>{account.name}</option>)}</select><select className="field" name="category">{categories.map(category => <option key={category}>{category}</option>)}</select><button className="btn w-full">حفظ العملية</button></form></div>}

      {tab === "budgets" && <div className="grid lg:grid-cols-[1fr_360px] gap-5"><section className="space-y-4">{budgets.map(budget => { const used = categorySpend[budget.category] || 0; const percent = Math.min(100, used / budget.amount * 100); return <article className="card p-5" key={budget.category}><div className="flex justify-between"><strong>{budget.category}</strong><span>{sar(used)} / {sar(budget.amount)}</span></div><div className="h-2 bg-black/10 rounded-full mt-4 overflow-hidden"><div className={percent >= 100 ? "h-full bg-red-500" : percent >= 80 ? "h-full bg-amber-500" : "h-full bg-emerald-500"} style={{ width: `${percent}%` }}/></div><p className="muted text-sm mt-3">المتبقي {sar(Math.max(0, budget.amount - used))}</p></article>; })}</section><aside className="space-y-4"><form onSubmit={addBudget} className="card p-6 space-y-4"><h2 className="font-bold text-xl">تحديد ميزانية</h2><select className="field" name="category">{categories.filter(category => category !== "دخل").map(category => <option key={category}>{category}</option>)}</select><input className="field" name="amount" type="number" min="1" placeholder="الميزانية" required/><button className="btn w-full">حفظ</button></form><form onSubmit={addCategory} className="card p-6 space-y-4"><h2 className="font-bold text-xl">تصنيف جديد</h2><input className="field" name="name" placeholder="اسم التصنيف" required/><button className="btn w-full">إضافة</button></form></aside></div>}

      {tab === "reports" && <><section className="grid sm:grid-cols-3 gap-4">{[["الدخل", income], ["المصروف", expenses], ["نسبة الادخار", income ? (income - expenses) / income * 100 : 0]].map(([label, value], index) => <article className="card p-5" key={String(label)}><p className="muted">{String(label)}</p><strong className="text-2xl block mt-2">{index === 2 ? `${Number(value).toFixed(1)}%` : sar(Number(value))}</strong></article>)}</section><article className="card p-6 mt-5"><h2 className="font-bold text-xl mb-5">المصروف حسب التصنيف</h2>{Object.entries(categorySpend).sort((a, b) => b[1] - a[1]).map(([category, amount]) => <div className="flex justify-between py-3 border-b" style={{ borderColor: "var(--line)" }} key={category}><span>{category}</span><strong>{sar(amount)}</strong></div>)}</article></>}
    </main>
    <nav className="fixed bottom-0 inset-x-0 md:hidden flex justify-around p-3 border-t" style={{ background: "var(--card)", borderColor: "var(--line)" }}>{nav.map(([id, label]) => <button className={`text-xs ${tab === id ? "font-bold text-teal-700" : ""}`} onClick={() => setTab(id)} key={id}>{label}</button>)}</nav>
  </div>;
}
