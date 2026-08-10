export type Account = {
  id: string;
  name: string;
  institution: string;
  kind: "bank" | "cash" | "savings" | "wallet" | "investment";
  openingBalance: number;
  color: string;
};

export type Category = {
  id: string;
  name: string;
  color: string;
  kind: "income" | "expense";
  group?: string;
  icon?: string;
  description?: string;
  protected?: boolean;
  hidden?: boolean;
};

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  kind: "income" | "expense";
  categoryId: string;
  accountId: string;
  date: string;
  note?: string;
};

export type Budget = {
  id: string;
  month: string;
  categoryId: string;
  amount: number;
};

export type Commitment = {
  id: string;
  title: string;
  amount: number;
  dueDay: number;
  categoryId: string;
  paidMonths: string[];
};

export type DemoState = {
  version: 4;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  commitments: Commitment[];
};

export type PeriodKey = "day" | "week" | "twoWeeks" | "month" | "twoMonths" | "quarter" | "sixMonths" | "year";

export type DateRange = {
  start: string;
  end: string;
  label: string;
  days: number;
};

export const PERIOD_OPTIONS: { id: PeriodKey; label: string; shortLabel: string }[] = [
  { id: "day", label: "اليوم", shortLabel: "يوم" },
  { id: "week", label: "٧ أيام", shortLabel: "أسبوع" },
  { id: "twoWeeks", label: "١٤ يومًا", shortLabel: "أسبوعان" },
  { id: "month", label: "الشهر", shortLabel: "شهر" },
  { id: "twoMonths", label: "شهران", shortLabel: "شهران" },
  { id: "quarter", label: "٣ أشهر", shortLabel: "٣ أشهر" },
  { id: "sixMonths", label: "٦ أشهر", shortLabel: "٦ أشهر" },
  { id: "year", label: "السنة", shortLabel: "سنة" },
];

// Keep the clean-start key while migrating the richer catalog without losing user entries.
export const STORAGE_KEY = "mali-finance-v3-clean";

export const categoryPalette = [
  "#1d8a68",
  "#d99b2b",
  "#3979b7",
  "#8b63b8",
  "#dc6670",
  "#577590",
  "#b36b3f",
  "#3d927d",
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "income-salary", name: "الراتب", icon: "💼", group: "الدخل الأساسي", description: "الراتب الشهري من جهة العمل", color: "#16805f", kind: "income", protected: true },
  { id: "income-business", name: "عمل أو مشروع", icon: "🏪", group: "الدخل الأساسي", description: "دخل النشاط التجاري أو المتجر", color: "#287f71", kind: "income", protected: true },
  { id: "income-freelance", name: "عمل حر", icon: "🧑‍💻", group: "دخل إضافي", description: "مشروع مستقل أو خدمة جانبية", color: "#3979b7", kind: "income", protected: true },
  { id: "income-bonus", name: "مكافأة أو عمولة", icon: "🎁", group: "دخل إضافي", description: "مكافأة، عمولة أو بدل", color: "#8b63b8", kind: "income", protected: true },
  { id: "income-investment", name: "عوائد استثمار", icon: "📈", group: "عوائد وأصول", description: "أرباح أسهم أو استثمارات", color: "#4d7f45", kind: "income", protected: true },
  { id: "income-rent", name: "دخل إيجار", icon: "🏠", group: "عوائد وأصول", description: "إيراد عقار أو أصل مؤجر", color: "#b36b3f", kind: "income", protected: true },
  { id: "income-refund", name: "استرداد مبلغ", icon: "↩️", group: "دخل آخر", description: "مبلغ مسترجع أو تعويض", color: "#577590", kind: "income", protected: true },
  { id: "income-gift", name: "هدية أو دعم", icon: "🤝", group: "دخل آخر", description: "هدية أو مساعدة مالية", color: "#9b6d85", kind: "income", protected: true },
  { id: "income-general", name: "دخل آخر", icon: "➕", group: "دخل آخر", description: "أي دخل لا يندرج تحت الخيارات السابقة", color: "#1d8a68", kind: "income", protected: true },

  { id: "expense-housing", name: "السكن والإيجار", icon: "🏠", group: "الأساسيات", description: "الإيجار ورسوم السكن", color: "#3979b7", kind: "expense", protected: true },
  { id: "expense-grocery", name: "المقاضي", icon: "🛒", group: "الأساسيات", description: "مشتريات المنزل والمواد الغذائية", color: "#3d927d", kind: "expense", protected: true },
  { id: "expense-restaurants", name: "المطاعم والقهوة", icon: "☕", group: "الأساسيات", description: "الوجبات الجاهزة والمقاهي", color: "#d99b2b", kind: "expense", protected: true },
  { id: "expense-utilities", name: "الكهرباء والمياه", icon: "💡", group: "الفواتير والخدمات", description: "فواتير الكهرباء والمياه والغاز", color: "#e0a32f", kind: "expense", protected: true },
  { id: "expense-telecom", name: "الجوال والإنترنت", icon: "📱", group: "الفواتير والخدمات", description: "الاتصالات وباقات الإنترنت", color: "#577590", kind: "expense", protected: true },
  { id: "expense-subscriptions", name: "الاشتراكات", icon: "🔁", group: "الفواتير والخدمات", description: "اشتراكات التطبيقات والمنصات", color: "#8b63b8", kind: "expense", protected: true },
  { id: "expense-transport", name: "النقل والمواصلات", icon: "🚕", group: "السيارة والتنقل", description: "أجرة النقل والتطبيقات والمواصلات", color: "#3e7890", kind: "expense", protected: true },
  { id: "expense-fuel", name: "الوقود", icon: "⛽", group: "السيارة والتنقل", description: "بنزين وشحن المركبات", color: "#b36b3f", kind: "expense", protected: true },
  { id: "expense-car", name: "صيانة السيارة", icon: "🚗", group: "السيارة والتنقل", description: "صيانة وتأمين ورسوم المركبة", color: "#735f4b", kind: "expense", protected: true },
  { id: "expense-health", name: "الصحة والعلاج", icon: "🩺", group: "الأسرة والحياة", description: "المستشفى والأدوية والعناية الصحية", color: "#dc6670", kind: "expense", protected: true },
  { id: "expense-education", name: "التعليم", icon: "🎓", group: "الأسرة والحياة", description: "المدارس والدورات والكتب", color: "#3979b7", kind: "expense", protected: true },
  { id: "expense-children", name: "الأطفال", icon: "🧸", group: "الأسرة والحياة", description: "احتياجات الأطفال والحضانة", color: "#c77b96", kind: "expense", protected: true },
  { id: "expense-family", name: "مصروف الأسرة", icon: "👨‍👩‍👧", group: "الأسرة والحياة", description: "مبالغ مخصصة لأفراد الأسرة", color: "#8b63b8", kind: "expense", protected: true },
  { id: "expense-debt", name: "أقساط وديون", icon: "🧾", group: "الالتزامات المالية", description: "سداد قرض أو دين أو تمويل", color: "#d25861", kind: "expense", protected: true },
  { id: "expense-insurance", name: "التأمين", icon: "🛡️", group: "الالتزامات المالية", description: "تأمين طبي أو مركبة أو ممتلكات", color: "#577590", kind: "expense", protected: true },
  { id: "expense-government", name: "رسوم حكومية", icon: "🏛️", group: "الالتزامات المالية", description: "رسوم وتجديدات ومخالفات", color: "#7b7269", kind: "expense", protected: true },
  { id: "expense-clothing", name: "الملابس", icon: "👕", group: "نمط الحياة", description: "الملابس والأحذية", color: "#8b63b8", kind: "expense", protected: true },
  { id: "expense-personal", name: "العناية الشخصية", icon: "✨", group: "نمط الحياة", description: "الحلاقة والعناية والمنتجات الشخصية", color: "#c77b96", kind: "expense", protected: true },
  { id: "expense-entertainment", name: "الترفيه", icon: "🎮", group: "نمط الحياة", description: "الفعاليات والألعاب والأنشطة", color: "#3979b7", kind: "expense", protected: true },
  { id: "expense-travel", name: "السفر", icon: "✈️", group: "نمط الحياة", description: "التذاكر والسكن ومصروف الرحلات", color: "#3d927d", kind: "expense", protected: true },
  { id: "expense-gifts", name: "الهدايا والمناسبات", icon: "🎁", group: "المجتمع والعطاء", description: "الهدايا والاحتفالات والمناسبات", color: "#d99b2b", kind: "expense", protected: true },
  { id: "expense-charity", name: "الصدقة والتبرعات", icon: "🤲", group: "المجتمع والعطاء", description: "صدقة أو تبرع أو زكاة", color: "#1d8a68", kind: "expense", protected: true },
  { id: "expense-home", name: "صيانة المنزل", icon: "🔧", group: "متفرقات", description: "إصلاحات وأثاث وأدوات منزلية", color: "#b36b3f", kind: "expense", protected: true },
  { id: "expense-pets", name: "الحيوانات الأليفة", icon: "🐾", group: "متفرقات", description: "الغذاء والعلاج والعناية", color: "#88765d", kind: "expense", protected: true },
  { id: "expense-emergency", name: "طوارئ", icon: "🚨", group: "متفرقات", description: "مصروف غير متوقع وعاجل", color: "#d25861", kind: "expense", protected: true },
  { id: "expense-general", name: "مصروف آخر", icon: "•••", group: "متفرقات", description: "أي مصروف لا يندرج تحت الخيارات السابقة", color: "#71857e", kind: "expense", protected: true },
];

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function formatRangeDate(value: string, includeYear = false) {
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" as const } : {}),
  }).format(parseDateKey(value));
}

export function periodRange(period: PeriodKey, anchor = dateKey()): DateRange {
  const endDate = parseDateKey(anchor);
  let startDate = new Date(endDate);
  if (period === "day") startDate = new Date(endDate);
  if (period === "week") startDate.setDate(startDate.getDate() - 6);
  if (period === "twoWeeks") startDate.setDate(startDate.getDate() - 13);
  if (["month", "twoMonths", "quarter", "sixMonths", "year"].includes(period)) {
    const monthCount = period === "month" ? 1 : period === "twoMonths" ? 2 : period === "quarter" ? 3 : period === "sixMonths" ? 6 : 12;
    startDate = new Date(endDate.getFullYear(), endDate.getMonth() - monthCount + 1, 1, 12);
    endDate.setMonth(endDate.getMonth() + 1, 0);
  }
  const start = dateKey(startDate);
  const end = dateKey(endDate);
  const days = Math.round((parseDateKey(end).getTime() - parseDateKey(start).getTime()) / 86_400_000) + 1;
  const label = start === end
    ? formatRangeDate(end, true)
    : `${formatRangeDate(start, parseDateKey(start).getFullYear() !== parseDateKey(end).getFullYear())} — ${formatRangeDate(end, true)}`;
  return { start, end, label, days };
}

export function shiftPeriodAnchor(anchor: string, period: PeriodKey, direction: -1 | 1) {
  const date = parseDateKey(anchor);
  const dayOffsets: Partial<Record<PeriodKey, number>> = { day: 1, week: 7, twoWeeks: 14 };
  if (dayOffsets[period]) date.setDate(date.getDate() + dayOffsets[period]! * direction);
  else {
    const monthOffsets: Record<Exclude<PeriodKey, "day" | "week" | "twoWeeks">, number> = { month: 1, twoMonths: 2, quarter: 3, sixMonths: 6, year: 12 };
    date.setMonth(date.getMonth() + monthOffsets[period as keyof typeof monthOffsets] * direction);
  }
  return dateKey(date);
}

export function monthsInRange(range: Pick<DateRange, "start" | "end">) {
  const start = parseDateKey(range.start);
  const end = parseDateKey(range.end);
  const result: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1, 12);
  while (cursor <= end) {
    result.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return result;
}

export function shiftMonth(month: string, offset: number) {
  const [year, value] = month.split("-").map(Number);
  return monthKey(new Date(year, value - 1 + offset, 1));
}

export function monthLabel(month: string) {
  const [year, value] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, value - 1, 1));
}

export function createEmptyState(): DemoState {
  return {
    version: 4,
    accounts: [],
    categories: DEFAULT_CATEGORIES.map((category) => ({ ...category })),
    transactions: [],
    budgets: [],
    commitments: [],
  };
}

export function restoreDemoState(value: unknown): DemoState | null {
  if (!value || typeof value !== "object") return null;
  const state = value as Partial<DemoState> & { version?: number };
  if (![3, 4].includes(state.version ?? 0)
    || !Array.isArray(state.accounts)
    || !Array.isArray(state.categories)
    || !Array.isArray(state.transactions)
    || !Array.isArray(state.budgets)
    || !Array.isArray(state.commitments)) return null;

  const defaultsById = new Map(DEFAULT_CATEGORIES.map((category) => [category.id, category]));
  const restoredCategories = state.categories.map((category) => {
    const catalogCategory = defaultsById.get(category.id);
    return catalogCategory ? { ...catalogCategory, hidden: category.hidden } : category;
  });
  const existingIds = new Set(restoredCategories.map((category) => category.id));
  return {
    version: 4,
    accounts: state.accounts,
    categories: [
      ...restoredCategories,
      ...DEFAULT_CATEGORIES.filter((category) => !existingIds.has(category.id)).map((category) => ({ ...category })),
    ],
    transactions: state.transactions,
    budgets: state.budgets,
    commitments: state.commitments,
  };
}
