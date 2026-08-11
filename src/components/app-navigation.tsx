"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { AppIcon, type AppIconName } from "@/components/app-icon";
import { ThemeToggle } from "@/components/theme-toggle";

const primary: ReadonlyArray<readonly [string, string, AppIconName]> = [
  ["/dashboard", "الرئيسية", "home"],
  ["/transactions", "العمليات", "transactions"],
  ["/accounts", "الحسابات", "accounts"],
  ["/budgets", "الميزانية", "budget"],
  ["/recurring", "الدفعات المتكررة", "repeat"],
  ["/reports", "التقارير", "reports"],
];

const planning: ReadonlyArray<readonly [string, string, AppIconName]> = [
  ["/debts", "الديون والأقساط", "debt"],
  ["/goals", "الأهداف المالية", "goal"],
  ["/emergency-fund", "صندوق الطوارئ", "shield"],
  ["/investments", "الاستثمارات", "investment"],
  ["/advisor", "المستشار المالي", "advisor"],
];

const mobile = primary.filter(([href]) => ["/dashboard", "/transactions", "/accounts", "/recurring", "/reports"].includes(href));
const active = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export function AppNavigation({ userName, userEmail }: { userName?: string | null; userEmail?: string | null }) {
  const pathname = usePathname();
  return <>
    <aside className="registered-sidebar">
      <Link className="registered-brand" href="/dashboard"><Image src="/icons/mali-icon.svg" alt="" width={46} height={46} priority unoptimized/><span><strong>مالي</strong><small>أموالك أوضح</small></span></Link>
      <div className="sidebar-sync-badge"><AppIcon name="cloud" size={17}/><span><strong>الحفظ السحابي يعمل</strong><small>كل تعديل يُحفظ تلقائيًا</small></span></div>
      <nav className="registered-nav" aria-label="التنقل الأساسي">{primary.map(([href, label, icon]) => <Link className={active(pathname, href) ? "active" : ""} key={href} href={href}><i><AppIcon name={icon}/></i><span>{label}</span></Link>)}</nav>
      <div className="registered-nav-group"><span>التخطيط المالي</span>{planning.map(([href, label, icon]) => <Link className={active(pathname, href) ? "active" : ""} key={href} href={href}><i><AppIcon name={icon} size={18}/></i>{label}</Link>)}</div>
      <div className="registered-sidebar-footer">
        <div className="signed-user"><span><AppIcon name="user" size={18}/></span><div><strong>{userName || "حسابي"}</strong><small>{userEmail || "بياناتك متزامنة"}</small></div></div>
        <ThemeToggle/>
        <Link href="/settings"><AppIcon name="settings" size={18}/>الإعدادات والوضوح</Link>
        <button onClick={() => signOut({ callbackUrl: "/login" })}><AppIcon name="logout" size={18}/>تسجيل الخروج</button>
      </div>
    </aside>

    <header className="registered-mobile-header"><Link href="/dashboard"><Image src="/icons/mali-icon.svg" alt="" width={36} height={36} priority unoptimized/><span><strong>مالي</strong><small><AppIcon name="cloud" size={12}/>محفوظ سحابيًا</small></span></Link><Link href="/settings" aria-label="الإعدادات"><AppIcon name="settings"/></Link></header>

    <nav className="registered-mobile-nav" aria-label="التنقل على الجوال">{mobile.map(([href, label, icon]) => <Link className={active(pathname, href) ? "active" : ""} key={href} href={href}><i><AppIcon name={icon}/></i><span>{label}</span></Link>)}</nav>
  </>;
}
