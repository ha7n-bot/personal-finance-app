"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type DemoTransaction = { id: number; title: string; category: string; amount: number; type: "income" | "expense" };
const initial: DemoTransaction[] = [
  { id: 1, title: "راتب", category: "دخل", amount: 8500, type: "income" },
  { id: 2, title: "مقاضي البيت", category: "مقاضي", amount: 640, type: "expense" },
  { id: 3, title: "بنزين", category: "بنزين", amount: 120, type: "expense" },
  { id: 4, title: "عمل حر", category: "دخل", amount: 1500, type: "income" },
];
const sar = (value: number) => new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR" }).format(value);

export default function DemoPage() {
  const [transactions, setTransactions] = useState(initial);
  const [quick, setQuick] = useState("");
  const totals = useMemo(() => ({
    income: transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
    expense: transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0),
  }), [transactions]);

  function addQuick() {
    const amount = Number(quick.match(/[\d,.]+/)?.[0]?.replaceAll(",", ""));
    if (!amount) return;
    const income = /دخل|راتب|استلمت|عمل حر/.test(quick);
    const title = quick.replace(/[\d,.]+/, "").trim() || (income ? "دخل" : "مصروف");
    setTransactions((rows) => [{ id: Date.now(), title, category: income ? "دخل" : title, amount, type: income ? "income" : "expense" }, ...rows]);
    setQuick("");
  }

  return <main className="min-h-screen p-5 md:p-10 max-w-7xl mx-auto">
    <header className="flex items-center justify-between mb-10"><div><p className="muted">وضع التجربة — البيانات لا تُحفظ</p><h1 className="text-3xl font-black">مالي</h1></div><Link className="btn" href="/register">إنشاء حساب حقيقي</Link></header>
    <section className="card p-6 md:p-8 mb-5 bg-gradient-to-l from-teal-950 to-slate-950 text-white"><p className="text-white/70">صافي الثروة التجريبي</p><strong className="text-4xl block mt-3">{sar(42200 + totals.income - totals.expense)}</strong><p className="text-emerald-300 mt-3">↑ 4.8% عن الشهر الماضي</p></section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-5">{[["الدخل", totals.income],["المصروف", totals.expense],["الفائض", totals.income - totals.expense],["صندوق الطوارئ",15000]].map(([label,value]) => <article className="card p-5" key={label}><p className="muted">{label}</p><strong className="text-2xl block mt-3">{sar(Number(value))}</strong></article>)}</section>
    <section className="grid lg:grid-cols-[1fr_380px] gap-5"><article className="card p-6"><h2 className="font-bold text-xl mb-5">آخر العمليات</h2>{transactions.map((transaction) => <div className="flex justify-between items-center py-4 border-b" style={{ borderColor: "var(--line)" }} key={transaction.id}><div><strong>{transaction.title}</strong><p className="muted text-sm">{transaction.category}</p></div><strong className={transaction.type === "income" ? "text-emerald-600" : ""}>{transaction.type === "income" ? "+" : "-"}{sar(transaction.amount)}</strong></div>)}</article><aside className="space-y-5"><div className="card p-6"><h2 className="font-bold text-xl mb-2">إدخال سريع</h2><p className="muted mb-4">جرّب: بنزين 80 أو استلمت 750 عمل حر</p><input className="field" value={quick} onChange={(event) => setQuick(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addQuick()} placeholder="اكتب العملية بالعربية"/><button className="btn w-full mt-3" onClick={addQuick}>تحليل وإضافة</button></div><div className="card p-6"><h2 className="font-bold text-xl">تنبيه الميزانية</h2><p className="muted mt-3">استخدمت 81% من ميزانية المطاعم.</p><div className="h-2 bg-black/10 rounded-full mt-4 overflow-hidden"><div className="h-full bg-amber-500 w-[81%]"/></div></div></aside></section>
  </main>;
}
