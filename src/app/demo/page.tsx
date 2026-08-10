"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Account,
  Budget,
  Category,
  Commitment,
  DemoState,
  PERIOD_OPTIONS,
  PeriodKey,
  STORAGE_KEY,
  Transaction,
  categoryPalette,
  createEmptyState,
  dateKey,
  monthKey,
  monthLabel,
  monthsInRange,
  periodRange,
  restoreDemoState,
  shiftMonth,
  shiftPeriodAnchor,
} from "@/lib/demo-store";

type Tab = "overview" | "accounts" | "transactions" | "budgets" | "reports";
type IconName = "grid" | "wallet" | "swap" | "target" | "chart" | "plus" | "up" | "down" | "bell" | "search" | "trash" | "chevronRight" | "chevronLeft" | "spark" | "check" | "download" | "calendar" | "edit" | "shield" | "info" | "eyeOff" | "eye";
type ReminderFrequency = "daily" | "weekly" | "biweekly" | "monthly";
type NotificationStatus = "unknown" | "ready" | "blocked" | "unsupported";

type ReminderPreferences = {
  enabled: boolean;
  frequency: ReminderFrequency;
  time: string;
};

const REMINDER_STORAGE_KEY = "mali-reminder-preferences-v1";
const DEFAULT_REMINDER: ReminderPreferences = { enabled: false, frequency: "daily", time: "20:00" };

const sar = (value: number, compact = false) =>
  new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: compact || Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: compact ? 1 : 2,
  }).format(value);

const pct = (value: number) =>
  new Intl.NumberFormat("ar-SA", { style: "percent", maximumFractionDigits: 0 }).format(value);

const num = (value: number) =>
  new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(value);

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00`));

const accountKindLabels: Record<Account["kind"], string> = {
  bank: "حساب بنكي",
  cash: "نقدي",
  savings: "ادخار",
  wallet: "محفظة رقمية",
  investment: "استثمار",
};

const navigation: { id: Tab; label: string; icon: IconName }[] = [
  { id: "overview", label: "الرئيسية", icon: "grid" },
  { id: "accounts", label: "الحسابات", icon: "wallet" },
  { id: "transactions", label: "العمليات", icon: "swap" },
  { id: "budgets", label: "الميزانية", icon: "target" },
  { id: "reports", label: "التقرير", icon: "chart" },
];

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    wallet: <><path d="M4 7V5a2 2 0 0 1 2-2h11"/><path d="M4 7h15a2 2 0 0 1 2 2v10H6a2 2 0 0 1-2-2V7Z"/><path d="M16 12h5v4h-5a2 2 0 0 1 0-4Z"/></>,
    swap: <><path d="m7 7 4-4 4 4"/><path d="M11 3v13"/><path d="m17 17-4 4-4-4"/><path d="M13 21V8"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
    chart: <><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19H2"/></>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    up: <><path d="m18 15-6-6-6 6"/><path d="M12 9v10"/></>,
    down: <><path d="m6 9 6 6 6-6"/><path d="M12 5v10"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    trash: <><path d="M4 7h16"/><path d="m9 11 .5 6"/><path d="m15 11-.5 6"/><path d="M6 7l1 14h10l1-14"/><path d="M9 7V4h6v3"/></>,
    chevronRight: <path d="m9 18 6-6-6-6"/>,
    chevronLeft: <path d="m15 18-6-6 6-6"/>,
    spark: <><path d="m12 3 1.2 4.1L17 9l-3.8 1.9L12 15l-1.2-4.1L7 9l3.8-1.9L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    download: <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7h.01"/></>,
    eyeOff: <><path d="m3 3 18 18"/><path d="M10.6 10.7a2 2 0 0 0 2.7 2.7"/><path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5.5 0 9 6 9 6a15 15 0 0 1-2.1 2.8"/><path d="M6.6 6.6C4.4 8 3 10 3 10s3.5 6 9 6c.8 0 1.6-.1 2.3-.4"/></>,
    eye: <><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="brand"><Image src="/icons/mali-icon.svg" alt="" width={44} height={44} priority unoptimized/><div className={compact ? "hidden sm:block" : ""}><strong>مالي</strong><span>أموالك أوضح، قراراتك أذكى</span></div></div>;
}

function MonthPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const current = monthKey();
  return <div className="month-picker" aria-label="اختيار الشهر">
    <button aria-label="الشهر التالي" disabled={value >= current} onClick={() => onChange(shiftMonth(value, 1))}><Icon name="chevronRight" size={17}/></button>
    <label><Icon name="calendar" size={17}/><span>{monthLabel(value)}</span><input type="month" value={value} max={current} onChange={(event) => event.target.value && onChange(event.target.value)}/></label>
    <button aria-label="الشهر السابق" onClick={() => onChange(shiftMonth(value, -1))}><Icon name="chevronLeft" size={17}/></button>
  </div>;
}

function PeriodPicker({ period, anchor, onPeriodChange, onAnchorChange }: { period: PeriodKey; anchor: string; onPeriodChange: (period: PeriodKey) => void; onAnchorChange: (date: string) => void }) {
  const range = periodRange(period, anchor);
  const today = dateKey();
  return <section className="period-picker card" aria-label="اختيار مدة الحسبة">
    <div className="period-options">{PERIOD_OPTIONS.map((option) => <button key={option.id} className={period === option.id ? "active" : ""} onClick={() => onPeriodChange(option.id)}><strong>{option.label}</strong><small>{option.shortLabel}</small></button>)}</div>
    <div className="period-navigation"><button aria-label="الفترة السابقة" onClick={() => onAnchorChange(shiftPeriodAnchor(anchor, period, -1))}><Icon name="chevronRight" size={17}/></button><label><Icon name="calendar" size={17}/><span><small>الفترة المحتسبة</small><strong>{range.label}</strong></span><input type="date" value={anchor} max={today} onChange={(event) => event.target.value && onAnchorChange(event.target.value)}/></label><button aria-label="الفترة التالية" disabled={anchor >= today} onClick={() => onAnchorChange(shiftPeriodAnchor(anchor, period, 1))}><Icon name="chevronLeft" size={17}/></button></div>
  </section>;
}

function Metric({ label, value, helper, icon, tone }: { label: string; value: string; helper: string; icon: IconName; tone: string }) {
  return <article className="card metric-card"><div className="metric-head"><span className="icon-box" style={{ color: tone, background: `color-mix(in srgb, ${tone} 12%, var(--card))` }}><Icon name={icon}/></span><small>{helper}</small></div><p>{label}</p><strong className="number">{value}</strong></article>;
}

function Empty({ title, body }: { title: string; body: string }) {
  return <div className="empty"><span><Icon name="spark"/></span><strong>{title}</strong><p>{body}</p></div>;
}

const pageGuides: Record<Tab, { title: string; body: string; points: string[] }> = {
  overview: { title: "صورتك المالية لأي مدة", body: "اختر يومًا أو أسبوعًا أو عدة أشهر؛ وكل الأرقام ستُحسب للفترة نفسها.", points: ["الرصيد: حتى نهاية الفترة", "الصافي: الدخل ناقص المصروف", "المتوسط اليومي: المصروف ÷ عدد الأيام"] },
  accounts: { title: "الحساب يعني مكان وجود المال", body: "أضف كل مكان تحتفظ فيه بمالك مرة واحدة، ثم اربط به عملياتك.", points: ["بنكي: حساب جاري", "نقدي: المال الموجود معك", "ادخار أو استثمار: مبلغ مخصص للمستقبل"] },
  transactions: { title: "العملية هي حركة مالية حدثت فعلًا", body: "سجّل الدخل عندما يصل، والمصروف عندما تدفعه. اختر النوع أولًا لتظهر تصنيفاته المناسبة فقط.", points: ["دخل: مبلغ دخل إلى حسابك", "مصروف: مبلغ خرج من حسابك", "التصنيف يشرح أين ذهب المبلغ"] },
  budgets: { title: "ثلاثة مفاهيم مختلفة", body: "الميزانية خطة، والالتزام مبلغ ثابت عليك، والعملية هي الدفع الفعلي.", points: ["حد الصرف: سقف اختياري", "الالتزام: فاتورة أو قسط متكرر", "تم السداد: متابعة لهذا الشهر"] },
  reports: { title: "التقرير يفسّر ولا يعقّد", body: "كل التقرير يتغير حسب المدة المختارة، مع مرجع ستة أشهر للمقارنة.", points: ["نسبة الفائض: ما بقي من الدخل", "المدة: يوم إلى سنة", "الترتيب: أكبر المصروفات أولًا"] },
};

function PageGuide({ tab }: { tab: Tab }) {
  const guide = pageGuides[tab];
  return <details className="page-guide" open={tab !== "overview"}>
    <summary><span><Icon name="info" size={18}/><strong>{guide.title}</strong></span><small>شرح سريع</small></summary>
    <div><p>{guide.body}</p><ul>{guide.points.map((point) => <li key={point}>{point}</li>)}</ul></div>
  </details>;
}

function CategoryOptions({ categories }: { categories: Category[] }) {
  const groups = categories.reduce<Record<string, Category[]>>((result, category) => {
    const group = category.group ?? (category.kind === "income" ? "دخل مخصص" : "مصروف مخصص");
    (result[group] ??= []).push(category);
    return result;
  }, {});
  return <>{Object.entries(groups).map(([group, items]) => <optgroup label={group} key={group}>{items.map((category) => <option value={category.id} key={category.id}>{category.icon ? `${category.icon} ` : ""}{category.name}</option>)}</optgroup>)}</>;
}

function CategoryLibrary({ categories, kind, onKindChange, onRemove, onRestore }: { categories: Category[]; kind: Category["kind"]; onKindChange: (kind: Category["kind"]) => void; onRemove: (category: Category) => void; onRestore: (category: Category) => void }) {
  const visible = categories.filter((category) => category.kind === kind && !category.hidden);
  const hidden = categories.filter((category) => category.kind === kind && category.hidden);
  const groups = visible.reduce<Record<string, Category[]>>((result, category) => {
    (result[category.group ?? "تصنيفات مخصصة"] ??= []).push(category);
    return result;
  }, {});
  return <div className="category-library">
    <div className="category-tabs"><button type="button" className={kind === "expense" ? "active" : ""} onClick={() => onKindChange("expense")}>مصروفات <b>{num(categories.filter((item) => item.kind === "expense" && !item.hidden).length)}</b></button><button type="button" className={kind === "income" ? "active" : ""} onClick={() => onKindChange("income")}>دخل <b>{num(categories.filter((item) => item.kind === "income" && !item.hidden).length)}</b></button></div>
    <div className="category-groups">{Object.entries(groups).map(([group, items]) => <section key={group}><header><strong>{group}</strong><span>{num(items.length)}</span></header>{items.map((category) => <div className="category-item" key={category.id}><i style={{ background: `color-mix(in srgb, ${category.color} 14%, var(--card))`, color: category.color }}>{category.icon ?? "✦"}</i><span><strong>{category.name}</strong><small>{category.description ?? "تصنيف مخصص"}</small></span><button type="button" onClick={() => onRemove(category)} aria-label={category.protected ? `إخفاء ${category.name}` : `حذف ${category.name}`} title={category.protected ? "إخفاء من القوائم" : "حذف التصنيف"}><Icon name={category.protected ? "eyeOff" : "trash"} size={15}/></button></div>)}</section>)}</div>
    {hidden.length ? <details className="hidden-categories"><summary>تصنيفات مخفية ({num(hidden.length)})</summary><div>{hidden.map((category) => <button type="button" key={category.id} onClick={() => onRestore(category)}><Icon name="eye" size={15}/>{category.icon} {category.name}</button>)}</div></details> : null}
  </div>;
}

export default function DemoPage() {
  const [state, setState] = useState<DemoState>(() => createEmptyState());
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [anchorDate, setAnchorDate] = useState(dateKey());
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | "income" | "expense">("all");
  const [transactionKind, setTransactionKind] = useState<Transaction["kind"]>("expense");
  const [categoryView, setCategoryView] = useState<Category["kind"]>("expense");
  const [notice, setNotice] = useState("");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [reminderPreferences, setReminderPreferences] = useState<ReminderPreferences>(DEFAULT_REMINDER);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>("unknown");

  const selectedMonth = anchorDate.slice(0, 7);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        const restored = restoreDemoState(parsed);
        if (restored) setState(restored);
      }
    } catch { /* keep a clean, safe start */ }
    setReady(true);
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(REMINDER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ReminderPreferences>;
        if (["daily", "weekly", "biweekly", "monthly"].includes(parsed.frequency ?? "") && /^\d{2}:\d{2}$/.test(parsed.time ?? "")) {
          setReminderPreferences({ enabled: Boolean(parsed.enabled), frequency: parsed.frequency as ReminderFrequency, time: parsed.time! });
        }
      }
    } catch { /* keep safe defaults */ }
    try {
      if (window.MaliAndroid) setNotificationStatus(window.MaliAndroid.notificationsEnabled() ? "ready" : "unknown");
      else if ("Notification" in window) setNotificationStatus(Notification.permission === "granted" ? "ready" : Notification.permission === "denied" ? "blocked" : "unknown");
      else setNotificationStatus("unsupported");
    } catch { setNotificationStatus("unknown"); }
    const syncNativeStatus = (event: Event) => setNotificationStatus((event as CustomEvent<{ enabled: boolean }>).detail.enabled ? "ready" : "blocked");
    window.addEventListener("mali-notification-status", syncNativeStatus);
    return () => window.removeEventListener("mali-notification-status", syncNativeStatus);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (navigation.some((item) => item.id === requestedTab)) setTab(requestedTab as Tab);
  }, []);

  const activeRange = useMemo(() => periodRange(period, anchorDate), [period, anchorDate]);
  const categoriesById = useMemo(() => Object.fromEntries(state.categories.map((item) => [item.id, item])), [state.categories]);
  const accountsById = useMemo(() => Object.fromEntries(state.accounts.map((item) => [item.id, item])), [state.accounts]);
  const rangeTransactions = useMemo(() => state.transactions.filter((item) => item.date >= activeRange.start && item.date <= activeRange.end).sort((a, b) => b.date.localeCompare(a.date)), [state.transactions, activeRange]);
  const monthTransactions = useMemo(() => state.transactions.filter((item) => item.date.startsWith(selectedMonth)), [state.transactions, selectedMonth]);
  const income = rangeTransactions.filter((item) => item.kind === "income").reduce((sum, item) => sum + item.amount, 0);
  const expenses = rangeTransactions.filter((item) => item.kind === "expense").reduce((sum, item) => sum + item.amount, 0);
  const monthExpenses = monthTransactions.filter((item) => item.kind === "expense").reduce((sum, item) => sum + item.amount, 0);
  const net = income - expenses;
  const savingsRate = income > 0 ? Math.max(0, net / income) : 0;
  const totalBalance = state.accounts.reduce((sum, account) => sum + account.openingBalance, 0) + state.transactions.filter((item) => item.date <= activeRange.end).reduce((sum, item) => sum + (item.kind === "income" ? item.amount : -item.amount), 0);
  const categorySpend = useMemo(() => rangeTransactions.filter((item) => item.kind === "expense").reduce<Record<string, number>>((result, item) => ({ ...result, [item.categoryId]: (result[item.categoryId] ?? 0) + item.amount }), {}), [rangeTransactions]);
  const monthBudgets = state.budgets.filter((item) => item.month === selectedMonth);
  const budgetTotal = monthBudgets.reduce((sum, item) => sum + item.amount, 0);
  const commitmentStats = useMemo(() => {
    let total = 0;
    let paid = 0;
    for (const month of monthsInRange(activeRange)) {
      const [year, monthNumber] = month.split("-").map(Number);
      const lastDay = new Date(year, monthNumber, 0).getDate();
      for (const commitment of state.commitments) {
        const dueDate = `${month}-${String(Math.min(commitment.dueDay, lastDay)).padStart(2, "0")}`;
        if (dueDate < activeRange.start || dueDate > activeRange.end) continue;
        total += commitment.amount;
        if (commitment.paidMonths.includes(month)) paid += commitment.amount;
      }
    }
    return { total, paid };
  }, [state.commitments, activeRange]);
  const commitmentTotal = commitmentStats.total;
  const monthCommitmentTotal = state.commitments.reduce((sum, item) => sum + item.amount, 0);
  const monthPaidCommitmentTotal = state.commitments.filter((item) => item.paidMonths.includes(selectedMonth)).reduce((sum, item) => sum + item.amount, 0);
  const hasFinancialData = state.accounts.length > 0 || state.transactions.length > 0 || state.commitments.length > 0 || state.budgets.length > 0;
  const financialScore = hasFinancialData ? Math.min(100,
    (state.accounts.length ? 25 : 0)
    + (state.transactions.length ? 25 : 0)
    + (state.budgets.length ? 15 : 0)
    + (state.commitments.length ? 15 : 0)
    + (income > 0 ? Math.round(Math.min(.5, savingsRate) * 40) : 0)
  ) : 0;
  const filteredTransactions = rangeTransactions.filter((item) => (kindFilter === "all" || item.kind === kindFilter) && (item.title.includes(query) || categoriesById[item.categoryId]?.name.includes(query)));
  const activeCategories = state.categories.filter((item) => !item.hidden);
  const expenseCategories = activeCategories.filter((item) => item.kind === "expense");
  const incomeCategories = activeCategories.filter((item) => item.kind === "income");
  const transactionCategories = transactionKind === "income" ? incomeCategories : expenseCategories;
  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2300);
  };

  const update = (recipe: (current: DemoState) => DemoState) => setState((current) => {
    const next = recipe(current);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  });

  function addTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const amount = Number(data.get("amount"));
    const kind = String(data.get("kind")) as Transaction["kind"];
    if (!amount || amount <= 0 || state.accounts.length === 0) return flash("أدخل مبلغًا صحيحًا وأضف حسابًا أولًا");
    const selectedCategory = state.categories.find((category) => category.id === String(data.get("categoryId")) && category.kind === kind && !category.hidden);
    if (!selectedCategory) return flash("اختر تصنيفًا مناسبًا لنوع العملية");
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      title: String(data.get("title")).trim(),
      amount,
      kind,
      categoryId: selectedCategory.id,
      accountId: String(data.get("accountId")),
      date: String(data.get("date")),
      note: String(data.get("note") ?? "").trim(),
    };
    update((current) => ({ ...current, transactions: [transaction, ...current.transactions] }));
    form.reset();
    setTransactionKind("expense");
    flash("تم حفظ العملية وتحديث الأرقام");
  }

  function addAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const account: Account = {
      id: crypto.randomUUID(),
      name: String(data.get("name")).trim(),
      institution: String(data.get("institution")).trim() || "حساب شخصي",
      kind: String(data.get("kind")) as Account["kind"],
      openingBalance: Number(data.get("openingBalance")) || 0,
      color: categoryPalette[state.accounts.length % categoryPalette.length],
    };
    update((current) => ({ ...current, accounts: [...current.accounts, account] }));
    form.reset();
    flash("تمت إضافة الحساب");
  }

  function addBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const categoryId = String(data.get("categoryId"));
    const amount = Number(data.get("amount"));
    if (!amount || amount <= 0) return flash("أدخل حدًا صحيحًا للميزانية");
    const budget: Budget = { id: crypto.randomUUID(), month: selectedMonth, categoryId, amount };
    update((current) => ({ ...current, budgets: [...current.budgets.filter((item) => !(item.month === selectedMonth && item.categoryId === categoryId)), budget] }));
    form.reset();
    flash("تم تحديث ميزانية الشهر");
  }

  function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name")).trim();
    const kind = String(data.get("kind")) as Category["kind"];
    if (!name || state.categories.some((item) => item.name === name && item.kind === kind)) return flash("التصنيف موجود أو الاسم غير مكتمل");
    const category: Category = { id: crypto.randomUUID(), name, kind, group: kind === "income" ? "دخل مخصص" : "مصروف مخصص", icon: "✦", description: "تصنيف أضفته أنت", color: categoryPalette[state.categories.length % categoryPalette.length] };
    update((current) => ({ ...current, categories: [...current.categories, category] }));
    form.reset();
    flash("تم إنشاء التصنيف ويمكن استخدامه الآن");
  }

  function addCommitment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const amount = Number(data.get("amount"));
    const dueDay = Number(data.get("dueDay"));
    if (!amount || amount <= 0 || dueDay < 1 || dueDay > 31) return flash("تحقق من مبلغ الالتزام ويوم الاستحقاق");
    const commitment: Commitment = {
      id: crypto.randomUUID(),
      title: String(data.get("title")).trim(),
      amount,
      dueDay,
      categoryId: String(data.get("categoryId")),
      paidMonths: [],
    };
    update((current) => ({ ...current, commitments: [...current.commitments, commitment] }));
    form.reset();
    flash("تمت إضافة الالتزام الشهري");
  }

  function toggleCommitment(commitment: Commitment) {
    update((current) => ({
      ...current,
      commitments: current.commitments.map((item) => item.id === commitment.id
        ? { ...item, paidMonths: item.paidMonths.includes(selectedMonth) ? item.paidMonths.filter((month) => month !== selectedMonth) : [...item.paidMonths, selectedMonth] }
        : item),
    }));
  }

  function removeCategory(category: Category) {
    const used = state.transactions.some((item) => item.categoryId === category.id) || state.commitments.some((item) => item.categoryId === category.id);
    if (category.protected) {
      update((current) => ({ ...current, categories: current.categories.map((item) => item.id === category.id ? { ...item, hidden: true } : item) }));
      return flash("تم إخفاء التصنيف ويمكن إعادته في أي وقت");
    }
    if (used) return flash("التصنيف مرتبط بعمليات؛ احذف العمليات المرتبطة أولًا");
    if (!window.confirm(`حذف تصنيف «${category.name}»؟`)) return;
    update((current) => ({ ...current, categories: current.categories.filter((item) => item.id !== category.id), budgets: current.budgets.filter((item) => item.categoryId !== category.id) }));
    flash("تم حذف التصنيف");
  }

  function restoreCategory(category: Category) {
    update((current) => ({ ...current, categories: current.categories.map((item) => item.id === category.id ? { ...item, hidden: false } : item) }));
    flash("عاد التصنيف إلى القوائم");
  }

  async function saveReminderPreferences(next: ReminderPreferences) {
    const [hour, minute] = next.time.split(":").map(Number);
    const saved = { ...next, enabled: true };
    setReminderPreferences(saved);
    window.localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(saved));
    if (window.MaliAndroid) {
      if (window.MaliAndroid.scheduleReminder) window.MaliAndroid.scheduleReminder(saved.frequency, hour, minute);
      else window.MaliAndroid.requestNotifications();
      setNotificationStatus(window.MaliAndroid.notificationsEnabled() ? "ready" : "unknown");
      return flash("تم حفظ التذكير؛ وافق على طلب الجوال وسيصل إشعار تجريبي فورًا");
    }
    if (!("Notification" in window)) {
      setNotificationStatus("unsupported");
      return flash("هذا المتصفح لا يدعم الإشعارات؛ استخدم تطبيق الجوال للتذكير في الخلفية");
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setNotificationStatus("blocked");
      return flash("الإشعارات محظورة؛ افتح إعدادات الموقع واسمح بها ثم جرّب مجددًا");
    }
    setNotificationStatus("ready");
    try {
      const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.ready : null;
      if (registration) await registration.showNotification("تذكير مالي جاهز", { body: "سنذكّرك بمراجعة مصروفاتك حسب الوقت الذي اخترته.", icon: "/icons/mali-icon.svg", tag: "mali-test-reminder" });
      else new Notification("تذكير مالي جاهز", { body: "تم تفعيل إشعارات مالي." });
    } catch { /* permission itself is the authoritative status */ }
    flash("تم تفعيل الإشعارات وإرسال تجربة الآن");
  }

  function disableReminders() {
    const next = { ...reminderPreferences, enabled: false };
    setReminderPreferences(next);
    window.localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(next));
    window.MaliAndroid?.cancelReminder?.();
    flash("تم إيقاف التذكير المالي");
  }

  function openNotificationSettings() {
    if (window.MaliAndroid?.openNotificationSettings) {
      window.MaliAndroid.openNotificationSettings();
      return;
    }
    flash("افتح إعدادات المتصفح ← إعدادات الموقع ← الإشعارات");
  }

  async function installApp() {
    if (!installPrompt) return flash("من قائمة المتصفح اختر: إضافة إلى الشاشة الرئيسية");
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  function resetAllData() {
    if (!window.confirm("سيتم حذف جميع الحسابات والعمليات والالتزامات والبدء من الصفر. هل تريد المتابعة؟")) return;
    const clean = createEmptyState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    setState(clean);
    setAnchorDate(dateKey());
    setPeriod("month");
    flash("تم مسح البيانات والبدء من الصفر");
  }

  if (!ready) return <div className="app-loading"><Image src="/icons/mali-icon.svg" alt="" width={68} height={68} priority unoptimized/><span>جارٍ تجهيز بياناتك…</span></div>;

  return <div className="mali-shell">
    {notice && <div className="toast"><Icon name="check" size={18}/>{notice}</div>}

    <aside className="sidebar">
      <Brand/>
      <nav>{navigation.map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><Icon name={item.icon}/><span>{item.label}</span></button>)}</nav>
      <div className="health-card"><div><Icon name="shield" size={18}/><span>اكتمال الصورة المالية</span></div><strong>{num(financialScore)}</strong><p>{financialScore === 0 ? "ابدأ بإدخال بياناتك" : financialScore >= 75 ? "ممتاز" : financialScore >= 45 ? "جيد" : "أكمل بياناتك"}</p><i><b style={{ width: `${financialScore}%` }}/></i></div>
    </aside>

    <section className="app-content">
      <header className="topbar"><div className="mobile-brand"><Brand compact/></div><div className="welcome"><strong>مرحبًا، هذه أموالك بوضوح</strong><span>يتم حفظ كل تعديل تلقائيًا على هذا الجهاز</span></div><div className="header-actions"><button className="icon-button" aria-label="إعداد الإشعارات" onClick={() => setTab("reports")}><Icon name="bell" size={19}/><i className={notificationStatus === "ready" ? "ready" : notificationStatus === "blocked" ? "blocked" : ""}/></button><button className="primary-button" onClick={() => setTab("transactions")}><Icon name="plus" size={18}/><span>عملية جديدة</span></button></div></header>

      <main>
        <div className="page-toolbar"><div><span className="eyebrow">لوحة مالية شخصية</span><h1>{navigation.find((item) => item.id === tab)?.label}</h1></div>{tab === "accounts" || tab === "budgets" ? <MonthPicker value={selectedMonth} onChange={(month) => setAnchorDate(month === monthKey() ? dateKey() : `${month}-01`)}/> : null}</div>
        {tab === "overview" || tab === "transactions" || tab === "reports" ? <PeriodPicker period={period} anchor={anchorDate} onPeriodChange={setPeriod} onAnchorChange={setAnchorDate}/> : null}
        <PageGuide tab={tab}/>

        {tab === "overview" && <Overview state={state} selectedMonth={selectedMonth} period={period} periodLabel={activeRange.label} rangeDays={activeRange.days} income={income} expenses={expenses} net={net} savingsRate={savingsRate} totalBalance={totalBalance} commitmentTotal={commitmentTotal} categorySpend={categorySpend} categoriesById={categoriesById} transactions={rangeTransactions} monthBudgets={monthBudgets} onNavigate={setTab}/>}

        {tab === "accounts" && <div className="page-grid accounts-layout"><section><div className="section-heading"><div><h2>حساباتك</h2><p>أدخل ما لديك في البنك أو النقد أو الادخار كما هو الآن</p></div><span className="pill">{num(state.accounts.length)} حساب</span></div>{state.accounts.length === 0 ? <div className="card"><Empty title="ابدأ بأول حساب" body="أضف حسابك البنكي أو محفظتك النقدية وحدد الرصيد الحالي"/></div> : <div className="account-grid">{state.accounts.map((account) => {
          const balance = account.openingBalance + state.transactions.filter((item) => item.accountId === account.id && item.date.slice(0, 7) <= selectedMonth).reduce((sum, item) => sum + (item.kind === "income" ? item.amount : -item.amount), 0);
          return <article className="account-card" key={account.id} style={{ "--account-color": account.color } as React.CSSProperties}><div><span className="account-icon"><Icon name="wallet"/></span><span className="pill">{accountKindLabels[account.kind] ?? "حساب"}</span></div><p>{account.institution}</p><h3>{account.name}</h3><strong className="number">{sar(balance)}</strong><small>الرصيد الحالي</small></article>;
        })}</div>}</section><FormCard title="إضافة حساب" body="اختر المكان الذي تحتفظ فيه بالمال ثم اكتب الرصيد الفعلي"><form onSubmit={addAccount} className="form-stack"><Field label="اسم واضح للحساب" hint="مثال: حساب الراتب"><input className="field" name="name" required placeholder="حساب الراتب"/></Field><Field label="البنك أو الوصف" hint="اختياري"><input className="field" name="institution" placeholder="اسم البنك أو المحفظة"/></Field><div className="form-row"><Field label="نوع الحساب"><select className="field" name="kind" defaultValue="bank"><option value="bank">حساب بنكي</option><option value="cash">نقد موجود معي</option><option value="savings">حساب ادخار</option><option value="wallet">محفظة رقمية</option><option value="investment">حساب استثماري</option></select></Field><Field label="الرصيد الحالي" hint="يمكن أن يكون صفرًا"><input className="field number-input" name="openingBalance" type="number" step="0.01" min="0" defaultValue="0"/></Field></div><button className="primary-button wide" type="submit"><Icon name="plus" size={18}/>إضافة الحساب</button></form></FormCard></div>}

        {tab === "transactions" && <div className="page-grid transactions-layout">
          <section className="card table-card">
            <div className="table-tools"><div><h2>عمليات الفترة المختارة</h2><p>{activeRange.label} · {num(filteredTransactions.length)} عملية</p></div><div className="search-box"><Icon name="search" size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالاسم أو التصنيف"/></div><select className="small-select" value={kindFilter} onChange={(event) => setKindFilter(event.target.value as typeof kindFilter)}><option value="all">كل العمليات</option><option value="income">الدخل فقط</option><option value="expense">المصروف فقط</option></select></div>
            {filteredTransactions.length ? <div className="transaction-list">{filteredTransactions.map((item) => <TransactionRow key={item.id} item={item} category={categoriesById[item.categoryId]} account={accountsById[item.accountId]} onDelete={() => { if (window.confirm(`حذف عملية «${item.title}»؟`)) update((current) => ({ ...current, transactions: current.transactions.filter((transaction) => transaction.id !== item.id) })); }}/>)}</div> : <Empty title="لا توجد عمليات هنا" body="اختر دخل أو مصروف من النموذج وسجّل أول حركة مالية"/>}
          </section>
          <FormCard title="تسجيل حركة مالية" body="ابدأ بتحديد هل المبلغ دخل إلى حسابك أم خرج منه">
            <form onSubmit={addTransaction} className="form-stack">
              {state.accounts.length === 0 ? <div className="form-alert">قبل تسجيل أي حركة: أضف حسابًا من صفحة الحسابات حتى نعرف أين يوجد المال.</div> : null}
              <div className="kind-picker" role="group" aria-label="نوع الحركة المالية">
                <button type="button" className={transactionKind === "expense" ? "active expense" : ""} onClick={() => setTransactionKind("expense")}><Icon name="down" size={18}/><span><strong>مصروف</strong><small>مبلغ خرج من حسابي</small></span></button>
                <button type="button" className={transactionKind === "income" ? "active income" : ""} onClick={() => setTransactionKind("income")}><Icon name="up" size={18}/><span><strong>دخل</strong><small>مبلغ وصل إلى حسابي</small></span></button>
              </div>
              <input type="hidden" name="kind" value={transactionKind}/>
              <Field label="اسم العملية" hint="اكتب وصفًا تعرفه لاحقًا"><input className="field" name="title" required placeholder={transactionKind === "income" ? "مثال: راتب شهر أغسطس" : "مثال: فاتورة الكهرباء"}/></Field>
              <Field label="المبلغ بالريال"><input className="field number-input amount-field" name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" required placeholder="0"/></Field>
              <Field label="التصنيف" hint={`${num(transactionCategories.length)} خيارًا مرتبة في مجموعات`}><select className="field" name="categoryId" key={transactionKind} defaultValue={transactionCategories[0]?.id}><CategoryOptions categories={transactionCategories}/></select></Field>
              <Field label="الحساب" hint="أين دخل أو خرج المبلغ؟"><select className="field" name="accountId" defaultValue={state.accounts[0]?.id}>{state.accounts.map((item) => <option value={item.id} key={item.id}>{accountKindLabels[item.kind]} — {item.name}</option>)}</select></Field>
              <div className="form-row"><Field label="التاريخ"><input className="field" name="date" type="date" defaultValue={anchorDate} max={dateKey()} required/></Field><Field label="ملاحظة" hint="اختياري"><input className="field" name="note" placeholder="تفصيل إضافي"/></Field></div>
              <button className="primary-button wide" type="submit" disabled={state.accounts.length === 0}><Icon name="check" size={18}/>حفظ {transactionKind === "income" ? "الدخل" : "المصروف"}</button>
            </form>
          </FormCard>
        </div>}

        {tab === "budgets" && <div className="budget-page">
          <section className="budget-summary card"><div><span>ميزانية {monthLabel(selectedMonth)}</span><strong className="number">{sar(budgetTotal)}</strong><small>المصروف الفعلي {sar(monthExpenses)}</small></div><BudgetRing used={monthExpenses} total={budgetTotal}/><div><span>الالتزامات الشهرية</span><strong className="number">{sar(monthCommitmentTotal)}</strong><small>تم سداد {sar(monthPaidCommitmentTotal)}</small></div></section>
          <div className="page-grid budget-layout">
            <section className="card budget-list"><div className="section-heading"><div><h2>حدود الصرف</h2><p>ضع سقفًا فقط للبنود التي تريد مراقبتها</p></div><span className="pill">خطة وليست مصروفًا</span></div>{monthBudgets.length ? monthBudgets.map((budget) => <BudgetLine key={budget.id} budget={budget} category={categoriesById[budget.categoryId]} used={categorySpend[budget.categoryId] ?? 0} onDelete={() => update((current) => ({ ...current, budgets: current.budgets.filter((item) => item.id !== budget.id) }))}/>) : <Empty title="لا توجد حدود صرف" body="هذا اختياري: اختر تصنيفًا مثل المطاعم وحدد الحد الذي لا تريد تجاوزه"/>}</section>
            <div className="side-stack">
              <FormCard title="إضافة حد صرف" body="لا يخصم أي مبلغ؛ إنه هدف للمقارنة فقط"><form onSubmit={addBudget} className="form-stack"><Field label="بند المصروف"><select className="field" name="categoryId" defaultValue={expenseCategories[0]?.id}><CategoryOptions categories={expenseCategories}/></select></Field><Field label="الحد خلال الشهر"><input className="field number-input amount-field" type="number" inputMode="decimal" name="amount" min="1" step="0.01" required placeholder="0"/></Field><button className="primary-button wide" type="submit"><Icon name="target" size={18}/>حفظ حد الصرف</button></form></FormCard>
              <FormCard title="مكتبة التصنيفات" body="تصنيفات جاهزة مرتبة؛ يمكنك إخفاء ما لا تحتاجه أو إضافة تصنيفك"><form onSubmit={addCategory} className="category-form"><input className="field" name="name" required placeholder="تصنيف جديد"/><select className="field" name="kind" value={categoryView} onChange={(event) => setCategoryView(event.target.value as Category["kind"])}><option value="expense">مصروف</option><option value="income">دخل</option></select><button className="primary-button" type="submit" aria-label="إضافة التصنيف"><Icon name="plus"/></button></form><CategoryLibrary categories={state.categories} kind={categoryView} onKindChange={setCategoryView} onRemove={removeCategory} onRestore={restoreCategory}/></FormCard>
            </div>
          </div>
          <section className="card commitments-card"><div className="section-heading"><div><h2>الالتزامات الشهرية</h2><p>مبلغ معروف يتكرر عليك مثل الإيجار أو القسط أو فاتورة ثابتة</p></div><span className="pill">غير المسدد {sar(monthCommitmentTotal - monthPaidCommitmentTotal)}</span></div><div className="commitments-layout"><div>{state.commitments.length ? state.commitments.map((commitment) => <CommitmentRow key={commitment.id} commitment={commitment} category={categoriesById[commitment.categoryId]} month={selectedMonth} onToggle={() => toggleCommitment(commitment)} onDelete={() => update((current) => ({ ...current, commitments: current.commitments.filter((item) => item.id !== commitment.id) }))}/>) : <Empty title="لا توجد التزامات" body="أضف الالتزامات الثابتة فقط، أما الشراء العادي فسجّله في العمليات"/>}</div><form onSubmit={addCommitment} className="form-stack commitment-form"><div className="form-tip"><Icon name="info" size={17}/><span><strong>مثال واضح</strong><small>إيجار ٢٬٥٠٠ ر.س. يستحق يوم ١ من كل شهر</small></span></div><Field label="اسم الالتزام"><input className="field" name="title" required placeholder="مثال: إيجار المنزل"/></Field><div className="form-row"><Field label="المبلغ الشهري"><input className="field number-input amount-field" inputMode="decimal" name="amount" type="number" min="0.01" step="0.01" required placeholder="0"/></Field><Field label="يوم الاستحقاق" hint="من 1 إلى 31"><input className="field number-input" name="dueDay" type="number" min="1" max="31" required placeholder="1"/></Field></div><Field label="التصنيف"><select className="field" name="categoryId" defaultValue={expenseCategories[0]?.id}><CategoryOptions categories={expenseCategories}/></select></Field><button className="primary-button wide" type="submit"><Icon name="plus" size={18}/>إضافة الالتزام الشهري</button></form></div></section>
        </div>}

        {tab === "reports" && <Reports state={state} selectedMonth={selectedMonth} periodLabel={activeRange.label} income={income} expenses={expenses} net={net} commitmentTotal={commitmentTotal} categorySpend={categorySpend} categoriesById={categoriesById} installApp={installApp} reminderPreferences={reminderPreferences} setReminderPreferences={setReminderPreferences} notificationStatus={notificationStatus} saveReminderPreferences={saveReminderPreferences} disableReminders={disableReminders} openNotificationSettings={openNotificationSettings} resetAllData={resetAllData}/>}
      </main>
    </section>

    <nav className="mobile-nav">{navigation.map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><Icon name={item.icon} size={20}/><span>{item.label}</span></button>)}</nav>
  </div>;
}

function Overview({ selectedMonth, period, periodLabel, rangeDays, income, expenses, net, savingsRate, totalBalance, commitmentTotal, categorySpend, categoriesById, transactions, monthBudgets, state, onNavigate }: { selectedMonth: string; period: PeriodKey; periodLabel: string; rangeDays: number; income: number; expenses: number; net: number; savingsRate: number; totalBalance: number; commitmentTotal: number; categorySpend: Record<string, number>; categoriesById: Record<string, Category>; transactions: Transaction[]; monthBudgets: Budget[]; state: DemoState; onNavigate: (tab: Tab) => void }) {
  const topSpend = Object.entries(categorySpend).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const budgetUsed = monthBudgets.reduce((sum, budget) => sum + Math.min(categorySpend[budget.categoryId] ?? 0, budget.amount), 0);
  const hasData = state.accounts.length > 0 || state.transactions.length > 0 || state.commitments.length > 0 || state.budgets.length > 0;
  return <div className="overview">
    {!hasData ? <section className="setup-guide card"><div><span className="setup-badge">بداية نظيفة</span><h2>كل الأرقام صفر حتى تدخل بياناتك بنفسك</h2><p>ابدأ بالحساب والرصيد الموجود الآن، ثم سجّل دخلك ومصروفك والتزاماتك.</p></div><div className="setup-steps"><button onClick={() => onNavigate("accounts")}><b>١</b><span><strong>أضف حسابك</strong><small>البنك أو النقد والرصيد الحالي</small></span></button><button onClick={() => onNavigate("transactions")}><b>٢</b><span><strong>سجّل الدخل والمصروف</strong><small>أرقامك الحقيقية لهذا الشهر</small></span></button><button onClick={() => onNavigate("budgets")}><b>٣</b><span><strong>أضف التزاماتك</strong><small>الأقساط والفواتير الثابتة</small></span></button></div></section> : null}
    <section className="hero-card"><div><span className="hero-kicker"><Icon name="spark" size={16}/> حسبة {PERIOD_OPTIONS.find((item) => item.id === period)?.label} · {periodLabel}</span><h2>{hasData ? "صورتك المالية" : "ابدأ من أرقامك"}<br/><em>{hasData ? (net >= 0 ? "واضحة أمامك" : "وتحتاج موازنة") : "الحقيقية فقط"}</em></h2><p>{!hasData ? "لا توجد أمثلة أو مبالغ افتراضية. كل رقم سيظهر هنا سيكون من إدخالك أنت." : net >= 0 ? `صافي الفترة المختارة ${sar(net)}.` : `المصروف أعلى من الدخل بمقدار ${sar(Math.abs(net))} في هذه الفترة.`}</p><button onClick={() => onNavigate(state.accounts.length ? "transactions" : "accounts")}><Icon name="plus" size={17}/>{state.accounts.length ? "سجّل عملية" : "أضف أول حساب"}</button></div><div className="hero-balance"><span>إجمالي ما لديك حتى نهاية الفترة</span><strong className="number">{sar(totalBalance)}</strong><small>الرصيد المتراكم من حساباتك وعملياتك</small></div></section>
    <section className="metric-grid"><Metric label="دخل الفترة" value={sar(income)} helper={income ? `${num(transactions.filter((item) => item.kind === "income").length)} عمليات` : "لم يُسجل بعد"} icon="up" tone="#16805f"/><Metric label="مصروف الفترة" value={sar(expenses)} helper={expenses ? `${num(transactions.filter((item) => item.kind === "expense").length)} عمليات` : "لم يُسجل بعد"} icon="down" tone="#d25861"/><Metric label="صافي الفترة" value={sar(net)} helper={!income && !expenses ? "يبدأ من صفر" : net >= 0 ? "فائض متاح" : "عجز يحتاج مراجعة"} icon="wallet" tone={net >= 0 ? "#3979b7" : "#d25861"}/><Metric label="التزامات مستحقة" value={sar(commitmentTotal)} helper={commitmentTotal ? `خلال ${periodLabel}` : "لا يوجد استحقاق في الفترة"} icon="target" tone="#c28a22"/></section>
    <section className="period-insights card"><div><span>متوسط المصروف اليومي</span><strong className="number">{sar(expenses / Math.max(rangeDays, 1))}</strong><small>المصروف ÷ {num(rangeDays)} يوم</small></div><div><span>متوسط الدخل اليومي</span><strong className="number positive">{sar(income / Math.max(rangeDays, 1))}</strong><small>الدخل ÷ {num(rangeDays)} يوم</small></div><div><span>متوسط العملية</span><strong className="number">{sar((income + expenses) / Math.max(transactions.length, 1))}</strong><small>{num(transactions.length)} عملية في الفترة</small></div><div><span>نسبة الفائض</span><strong>{income ? pct(net / income) : "٠٪"}</strong><small>الصافي من إجمالي الدخل</small></div></section>
    <section className="dashboard-grid"><article className="card chart-card"><div className="section-heading"><div><h2>الاتجاه الشهري المرجعي</h2><p>يساعدك على مقارنة الفترة المختارة باتجاه آخر ستة أشهر</p></div><span className="pill">آخر ٦ أشهر</span></div><TrendChart transactions={state.transactions} selectedMonth={selectedMonth}/></article><article className="card spend-card"><div className="section-heading"><div><h2>أين ذهب المصروف؟</h2><p>أعلى خمسة تصنيفات في الفترة المختارة</p></div></div>{topSpend.length ? <div className="spend-list">{topSpend.map(([id, value]) => { const category = categoriesById[id]; return <div key={id}><span><i style={{ background: category?.color ?? "#71857e" }}/>{category?.icon} {category?.name ?? "غير مصنف"}</span><strong className="number">{sar(value, true)}<small>{pct(value / Math.max(expenses, 1))}</small></strong><b><i style={{ width: `${expenses ? value / expenses * 100 : 0}%`, background: category?.color ?? "#71857e" }}/></b></div>; })}</div> : <Empty title="المصروف صفر" body="لا توجد مصروفات في هذه الفترة"/>}</article><article className="card recent-card"><div className="section-heading"><div><h2>أحدث عمليات الفترة</h2><p>{periodLabel}</p></div><button className="text-button" onClick={() => onNavigate("transactions")}>عرض الكل</button></div>{transactions.length ? transactions.slice(0, 5).map((item) => <TransactionRow key={item.id} item={item} category={categoriesById[item.categoryId]} account={state.accounts.find((account) => account.id === item.accountId)}/>) : <Empty title="لا توجد عمليات" body="غيّر الفترة أو أضف أول عملية"/>}</article><article className="card insight-card"><span><Icon name="spark" size={20}/></span><div><p>قراءة سريعة للفترة</p><h3>{!hasData ? "أضف حسابك لتبدأ القراءة" : expenses === 0 ? "لا يوجد مصروف في الفترة" : savingsRate >= .25 ? "ادخارك ممتاز في هذه الفترة" : savingsRate >= .1 ? "الوضع متوازن وقابل للتحسين" : "راجع أكبر مصروف"}</h3><small>{topSpend[0] ? `أعلى بند هو ${categoriesById[topSpend[0][0]]?.name ?? "المصروفات"} بقيمة ${sar(topSpend[0][1])}.` : "لن نعرض استنتاجات قبل وجود بيانات كافية."}</small></div><div className="mini-budget"><span>استخدام حدود شهر {monthLabel(selectedMonth)}</span><strong>{monthBudgets.length ? pct(budgetUsed / Math.max(1, monthBudgets.reduce((sum, item) => sum + item.amount, 0))) : "٠٪"}</strong></div></article></section>
  </div>;
}

function Reports({ state, selectedMonth, periodLabel, income, expenses, net, commitmentTotal, categorySpend, categoriesById, installApp, reminderPreferences, setReminderPreferences, notificationStatus, saveReminderPreferences, disableReminders, openNotificationSettings, resetAllData }: { state: DemoState; selectedMonth: string; periodLabel: string; income: number; expenses: number; net: number; commitmentTotal: number; categorySpend: Record<string, number>; categoriesById: Record<string, Category>; installApp: () => void; reminderPreferences: ReminderPreferences; setReminderPreferences: (preferences: ReminderPreferences) => void; notificationStatus: NotificationStatus; saveReminderPreferences: (preferences: ReminderPreferences) => Promise<void>; disableReminders: () => void; openNotificationSettings: () => void; resetAllData: () => void }) {
  const ranked = Object.entries(categorySpend).sort((a, b) => b[1] - a[1]);
  const score = income ? Math.max(0, Math.min(100, Math.round((net / income) * 100))) : 0;
  const hasData = state.accounts.length > 0 || state.transactions.length > 0 || state.commitments.length > 0;
  return <div className="reports-page"><section className="report-hero"><div><span>تقرير {periodLabel}</span><h2>{!hasData ? "التقرير يبدأ من صفر" : net >= 0 ? "ملخص الفترة واضح" : "المصروف يحتاج مراجعة"}</h2><p>{hasData ? "أربع أرقام أساسية وتحليل مباشر للفترة التي اخترتها." : "أدخل بياناتك أولًا، ولن نعرض أرقامًا أو تقييمات افتراضية."}</p></div><div className="report-score"><strong>{num(score)}٪</strong><span>نسبة الفائض</span></div></section><section className="report-strip"><div><span>دخل الفترة</span><strong className="number positive">{sar(income)}</strong></div><div><span>مصروف الفترة</span><strong className="number negative">{sar(expenses)}</strong></div><div><span>الالتزامات المستحقة</span><strong className="number">{sar(commitmentTotal)}</strong></div><div><span>صافي الفترة</span><strong className={`number ${net >= 0 ? "positive" : "negative"}`}>{sar(net)}</strong></div></section><section className="report-grid"><article className="card report-chart"><div className="section-heading"><div><h2>مرجع آخر ٦ أشهر</h2><p>الدخل أخضر والمصروف أحمر للمقارنة الزمنية</p></div></div><TrendChart transactions={state.transactions} selectedMonth={selectedMonth} bars/></article><article className="card ranking"><div className="section-heading"><div><h2>ترتيب مصروف الفترة</h2><p>من الأعلى إلى الأقل</p></div></div>{ranked.length ? ranked.map(([id, value], index) => <div key={id}><b>{num(index + 1)}</b><span><strong>{categoriesById[id]?.icon} {categoriesById[id]?.name ?? "غير مصنف"}</strong><small>{pct(value / Math.max(expenses, 1))} من المصروف</small></span><em className="number">{sar(value)}</em></div>) : <Empty title="لا يوجد تحليل بعد" body="لا توجد مصروفات في الفترة المختارة"/>}</article></section><NotificationSettings preferences={reminderPreferences} onChange={setReminderPreferences} status={notificationStatus} onSave={saveReminderPreferences} onDisable={disableReminders} onOpenSettings={openNotificationSettings}/><section className="settings-grid compact-settings"><article className="card action-card"><span className="action-icon"><Icon name="download"/></span><div><h3>أضف مالي للشاشة الرئيسية</h3><p>يفتح كأنه تطبيق مستقل ويمكن الوصول إليه بسرعة.</p></div><button className="primary-button" onClick={installApp}>إضافة الاختصار</button></article><article className="card action-card"><span className="action-icon"><Icon name="trash"/></span><div><h3>البدء من الصفر</h3><p>يحذف جميع بيانات هذا الجهاز بعد تأكيدك.</p></div><button className="secondary-button danger-button" onClick={resetAllData}>مسح جميع البيانات</button></article></section></div>;
}

function NotificationSettings({ preferences, onChange, status, onSave, onDisable, onOpenSettings }: { preferences: ReminderPreferences; onChange: (preferences: ReminderPreferences) => void; status: NotificationStatus; onSave: (preferences: ReminderPreferences) => Promise<void>; onDisable: () => void; onOpenSettings: () => void }) {
  const statusText = status === "ready" ? "مسموح" : status === "blocked" ? "محظور" : status === "unsupported" ? "غير مدعوم" : "لم يُفعّل";
  return <section className="card notification-settings"><div className="notification-copy"><span className="action-icon"><Icon name="bell"/></span><div><div className="notification-title"><h2>تذكير مالي ذكي</h2><span className={`notification-status ${status}`}>{statusText}</span></div><p>اختر متى تريد تذكيرك بتسجيل المصروف ومراجعة الالتزامات. عند الحفظ سيصل إشعار تجريبي فورًا للتأكد أن كل شيء يعمل.</p><small><Icon name="info" size={14}/>في تطبيق أندرويد يعمل التذكير حتى بعد إغلاق التطبيق. في المتصفح تعتمد الاستمرارية على سماح النظام بإشعارات الموقع.</small></div></div><div className="notification-form"><Field label="تكرار التذكير"><select className="field" value={preferences.frequency} onChange={(event) => onChange({ ...preferences, frequency: event.target.value as ReminderFrequency })}><option value="daily">كل يوم</option><option value="weekly">كل أسبوع</option><option value="biweekly">كل أسبوعين</option><option value="monthly">كل شهر</option></select></Field><Field label="وقت التذكير"><input className="field number-input" type="time" value={preferences.time} onChange={(event) => onChange({ ...preferences, time: event.target.value })}/></Field><button className="primary-button" onClick={() => onSave(preferences)}><Icon name="bell" size={17}/>حفظ وإرسال تجربة</button>{preferences.enabled ? <button className="secondary-button" onClick={onDisable}>إيقاف التذكير</button> : null}{status === "blocked" ? <button className="secondary-button danger-button" onClick={onOpenSettings}>فتح إعدادات الإشعارات</button> : null}</div></section>;
}

function TrendChart({ transactions, selectedMonth, bars = false }: { transactions: Transaction[]; selectedMonth: string; bars?: boolean }) {
  const months = Array.from({ length: 6 }, (_, index) => shiftMonth(selectedMonth, index - 5));
  const values = months.map((month) => ({ month, income: transactions.filter((item) => item.kind === "income" && item.date.startsWith(month)).reduce((sum, item) => sum + item.amount, 0), expense: transactions.filter((item) => item.kind === "expense" && item.date.startsWith(month)).reduce((sum, item) => sum + item.amount, 0) }));
  const max = Math.max(1, ...values.flatMap((item) => [item.income, item.expense]));
  const hasValues = values.some((item) => item.income > 0 || item.expense > 0);
  if (!hasValues) return <Empty title="الرسم ينتظر بياناتك" body="لن نرسم خطوطًا أو أعمدة وهمية؛ سيظهر بعد تسجيل أول دخل أو مصروف"/>;
  const height = (value: number) => value > 0 ? Math.max(5, value / max * 100) : 0;
  if (bars) return <div className="clear-chart"><div className="trend-legend"><span><i/>الدخل</span><span><i/>المصروف</span></div><div className="bar-chart" role="img" aria-label="مقارنة الدخل والمصروف خلال ستة أشهر">{values.map((item) => <div key={item.month} aria-label={`${monthLabel(item.month)}: دخل ${sar(item.income)}، مصروف ${sar(item.expense)}`} title={`دخل ${sar(item.income)} • مصروف ${sar(item.expense)}`}><div className="bars"><i style={{ height: `${height(item.income)}%` }}/><b style={{ height: `${height(item.expense)}%` }}/></div><span>{monthLabel(item.month).split(" ")[0]}</span></div>)}</div><ChartMonthSummary values={values}/></div>;
  const point = (key: "income" | "expense") => values.map((item, index) => `${index * 100 / 5},${90 - item[key] / max * 72}`).join(" ");
  return <div className="trend"><div className="trend-legend"><span><i/>الدخل — خط متصل</span><span><i/>المصروف — خط متقطع</span></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="اتجاه الدخل والمصروف خلال آخر ستة أشهر"><defs><linearGradient id="income-area-v2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1d8a68" stopOpacity=".26"/><stop offset="1" stopColor="#1d8a68" stopOpacity="0"/></linearGradient></defs>{[18,42,66,90].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y}/>) }<polygon points={`0,90 ${point("income")} 100,90`} fill="url(#income-area-v2)"/><polyline points={point("income")} className="income-line"/><polyline points={point("expense")} className="expense-line"/></svg><div className="chart-labels">{months.map((month) => <span key={month}>{monthLabel(month).split(" ")[0]}</span>)}</div><ChartMonthSummary values={values}/></div>;
}

function ChartMonthSummary({ values }: { values: { month: string; income: number; expense: number }[] }) {
  return <div className="chart-month-summary">{values.map((item) => <div key={item.month}><strong>{monthLabel(item.month).split(" ")[0]}</strong><span className="positive">دخل <b className="number">{sar(item.income, true)}</b></span><span className="negative">مصروف <b className="number">{sar(item.expense, true)}</b></span></div>)}</div>;
}

function TransactionRow({ item, category, account, onDelete }: { item: Transaction; category?: Category; account?: Account; onDelete?: () => void }) {
  return <div className="transaction-row"><span className="transaction-symbol" style={{ background: `color-mix(in srgb, ${category?.color ?? "#71857e"} 14%, var(--card))`, color: category?.color ?? "#71857e" }}>{category?.icon ?? category?.name?.[0] ?? "؟"}</span><div className="transaction-copy"><strong>{item.title}</strong><span>{category?.name ?? "غير مصنف"} · {account?.name ?? "حساب"} · {dateLabel(item.date)}</span></div><strong className={`number transaction-amount ${item.kind}`}>{item.kind === "income" ? "+" : "-"}{sar(item.amount)}</strong>{onDelete && <button className="row-action" onClick={onDelete} aria-label={`حذف ${item.title}`}><Icon name="trash" size={16}/></button>}</div>;
}

function CommitmentRow({ commitment, category, month, onToggle, onDelete }: { commitment: Commitment; category?: Category; month: string; onToggle: () => void; onDelete: () => void }) {
  const paid = commitment.paidMonths.includes(month);
  return <div className={`commitment-row ${paid ? "paid" : ""}`}><button className="commitment-check" onClick={onToggle} aria-label={paid ? `إلغاء سداد ${commitment.title}` : `تأكيد سداد ${commitment.title}`}><Icon name="check" size={17}/></button><div><strong>{commitment.title}</strong><span>{category?.name ?? "مصروف عام"} · يستحق يوم {commitment.dueDay}</span></div><strong className="number">{sar(commitment.amount)}</strong><span className="commitment-status">{paid ? "تم السداد" : "لم يُسدد"}</span><button className="row-action" onClick={onDelete} aria-label={`حذف ${commitment.title}`}><Icon name="trash" size={16}/></button></div>;
}

function BudgetLine({ budget, category, used, onDelete }: { budget: Budget; category?: Category; used: number; onDelete: () => void }) {
  const ratio = used / Math.max(1, budget.amount);
  return <div className="budget-line"><div className="budget-line-head"><span><i style={{ background: category?.color ?? "#71857e" }}/><strong>{category?.name ?? "تصنيف محذوف"}</strong></span><span><b className="number">{sar(used, true)}</b> من {sar(budget.amount, true)}<button onClick={onDelete} aria-label="حذف الميزانية"><Icon name="trash" size={15}/></button></span></div><div className="progress"><i style={{ width: `${Math.min(100, ratio * 100)}%`, background: ratio > 1 ? "var(--danger)" : category?.color }}/></div><small className={ratio > 1 ? "danger" : ""}>{ratio > 1 ? `تجاوزت الحد بـ ${sar(used - budget.amount)}` : `متبقٍ ${sar(budget.amount - used)}`}</small></div>;
}

function BudgetRing({ used, total }: { used: number; total: number }) {
  const ratio = total ? Math.min(1, used / total) : 0;
  return <div className="budget-ring" style={{ background: `conic-gradient(${used > total && total > 0 ? "var(--danger)" : "var(--accent)"} ${ratio * 100}%, var(--card-soft) 0)` }}><div><strong>{total ? pct(used / total) : "—"}</strong><span>مستخدم</span></div></div>;
}

function FormCard({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return <aside className="card form-card"><div><h2>{title}</h2><p>{body}</p></div>{children}</aside>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="field-label"><span>{label}{hint ? <small>{hint}</small> : null}</span>{children}</label>;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface Window {
    MaliAndroid?: {
      requestNotifications: () => void;
      notificationsEnabled: () => boolean;
      scheduleReminder?: (frequency: ReminderFrequency, hour: number, minute: number) => void;
      cancelReminder?: () => void;
      openNotificationSettings?: () => void;
    };
  }
}
