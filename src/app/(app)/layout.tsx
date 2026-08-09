import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";

const primaryLinks = [
  ["/dashboard", "الرئيسية"], ["/transactions", "العمليات"], ["/accounts", "الحسابات"],
  ["/budgets", "الميزانية"], ["/recurring", "الالتزامات"], ["/debts", "الديون"],
  ["/emergency-fund", "صندوق الطوارئ"], ["/goals", "الأهداف"], ["/investments", "الاستثمارات"],
  ["/reports", "التقارير"], ["/advisor", "المستشار المالي"], ["/notifications", "الإشعارات"], ["/settings", "الإعدادات"],
];
const mobileLinks = primaryLinks.slice(0, 5);

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  return <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
    <aside className="hidden md:flex flex-col border-l p-5 max-h-screen sticky top-0 overflow-y-auto" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
      <h1 className="text-2xl font-black mb-7">مالي</h1>
      <nav className="space-y-1">{primaryLinks.map(([href, label]) => <Link key={href} className="block rounded-xl px-3 py-2.5 hover:bg-black/5 dark:hover:bg-white/5" href={href}>{label}</Link>)}</nav>
      <div className="mt-auto pt-6 space-y-3"><ThemeToggle/><form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}><button className="muted">تسجيل الخروج</button></form></div>
    </aside>
    <main className="p-5 pb-24 md:p-10 min-w-0">{children}</main>
    <nav className="fixed bottom-0 inset-x-0 md:hidden flex justify-around gap-2 p-3 border-t overflow-x-auto" style={{ background: "var(--card)", borderColor: "var(--line)" }}>{mobileLinks.map(([href, label]) => <Link className="text-sm whitespace-nowrap" key={href} href={href}>{label}</Link>)}</nav>
  </div>;
}
