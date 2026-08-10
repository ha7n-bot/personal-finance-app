import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { googleEnabled } from "@/auth";

export default async function Register({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const requested = (await searchParams).callbackUrl;
  const callbackUrl = requested?.startsWith("/") && !requested.startsWith("//") ? requested : undefined;
  return <main className="auth-page"><section className="auth-card card">
    <div className="auth-brand"><Image src="/icons/mali-icon.svg" alt="" width={52} height={52} priority unoptimized/><div><strong>مالي</strong><span>حساب واحد للجوال والويب</span></div></div>
    <p className="muted">ابدأ رحلتك المالية</p><h1>إنشاء حساب آمن</h1><p className="auth-intro">سجّل باستخدام Google أو البريد الإلكتروني، ثم أضف حسابك المالي الأول.</p>
    <AuthForm mode="register" googleEnabled={googleEnabled} callbackUrl={callbackUrl}/>
    <p className="auth-footer">لديك حساب؟ <Link href={{ pathname: "/login", query: callbackUrl ? { callbackUrl } : {} }}>سجّل الدخول</Link></p>
  </section></main>;
}
