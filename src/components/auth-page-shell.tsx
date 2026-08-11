import Image from "next/image";
import type { ReactNode } from "react";
import { AppIcon } from "@/components/app-icon";

export function AuthPageShell({ eyebrow, title, intro, children, footer }: { eyebrow: string; title: string; intro: string; children: ReactNode; footer: ReactNode }) {
  return <main className="auth-page">
    <section className="auth-layout">
      <aside className="auth-story">
        <div className="auth-story-brand"><Image src="/icons/mali-icon.svg" alt="" width={58} height={58} priority unoptimized/><span><strong>مالي</strong><small>حساب واحد للجوال والويب</small></span></div>
        <div className="auth-story-copy"><span className="auth-story-kicker"><AppIcon name="cloud" size={17}/>حفظ سحابي تلقائي</span><h2>بياناتك المالية ترجع لك متى ما رجعت إلى حسابك</h2><p>احذف التطبيق أو غيّر جوالك؛ سجّل بالحساب نفسه وستجد حساباتك وعملياتك وتقاريرك في مكانها.</p></div>
        <div className="auth-benefits">
          <span><AppIcon name="check"/><b>لا تحتاج نسخًا يدويًا</b></span>
          <span><AppIcon name="check"/><b>كل مستخدم يرى بياناته فقط</b></span>
          <span><AppIcon name="check"/><b>متوافق مع الويب والجوال</b></span>
        </div>
        <p className="auth-privacy-note"><AppIcon name="info" size={16}/>Google يستخدم لتأكيد هويتك. بياناتك المالية تُحفظ في قاعدة بيانات مالي السحابية المرتبطة بحسابك، وليست داخل بريدك.</p>
      </aside>

      <section className="auth-card card">
        <div className="auth-mobile-brand"><Image src="/icons/mali-icon.svg" alt="" width={48} height={48} priority unoptimized/><strong>مالي</strong></div>
        <span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p className="auth-intro">{intro}</p>
        {children}
        <div className="auth-footer">{footer}</div>
      </section>
    </section>
  </main>;
}
