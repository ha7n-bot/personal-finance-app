"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";

const primary = [["/dashboard", "الرئيسية", "⌂"], ["/transactions", "العمليات", "↕"], ["/accounts", "الحسابات", "▣"], ["/budgets", "الميزانية", "◎"], ["/recurring", "الدفعات المتكررة", "↻"], ["/reports", "التقارير", "▥"]] as const;
const planning = [["/debts", "الديون والأقساط"], ["/goals", "الأهداف المالية"], ["/emergency-fund", "صندوق الطوارئ"], ["/investments", "الاستثمارات"], ["/advisor", "المستشار المالي"]] as const;
const mobile = primary.filter(([href]) => ["/dashboard", "/transactions", "/accounts", "/recurring", "/reports"].includes(href));
const active = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export function AppNavigation({ userName }: { userName?: string | null }) {
  const pathname = usePathname();
  return <><aside className="registered-sidebar"><Link className="registered-brand" href="/dashboard"><Image src="/icons/mali-icon.svg" alt="" width={46} height={46} priority unoptimized/><span><strong>مالي</strong><small>أموالك أوضح</small></span></Link><nav className="registered-nav">{primary.map(([href, label, icon]) => <Link className={active(pathname, href) ? "active" : ""} key={href} href={href}><i>{icon}</i><span>{label}</span></Link>)}</nav><div className="registered-nav-group"><span>التخطيط المالي</span>{planning.map(([href, label]) => <Link className={active(pathname, href) ? "active" : ""} key={href} href={href}>{label}</Link>)}</div><div className="registered-sidebar-footer"><div className="signed-user"><strong>{userName || "حسابي"}</strong><small>بياناتك متزامنة</small></div><ThemeToggle/><Link href="/settings">الإعدادات</Link><button onClick={() => signOut({ callbackUrl: "/login" })}>تسجيل الخروج</button></div></aside><nav className="registered-mobile-nav">{mobile.map(([href, label, icon]) => <Link className={active(pathname, href) ? "active" : ""} key={href} href={href}><i>{icon}</i><span>{label}</span></Link>)}</nav></>;
}
