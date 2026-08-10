import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { googleEnabled } from "@/auth";

export default async function Login({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const requested = (await searchParams).callbackUrl;
  const callbackUrl = requested?.startsWith("/") && !requested.startsWith("//") ? requested : undefined;
  return <main className="auth-page"><section className="auth-card card">
    <div className="auth-brand"><Image src="/icons/mali-icon.svg" alt="" width={52} height={52} priority unoptimized/><div><strong>مالي</strong><span>أموالك أوضح، قراراتك أذكى</span></div></div>
    <p className="muted">مرحبًا بعودتك</p><h1>دخول إلى حسابك</h1><p className="auth-intro">ادخل من أي جهاز، وستبقى حساباتك وعملياتك محفوظة في مكان واحد.</p>
    <AuthForm mode="login" googleEnabled={googleEnabled} callbackUrl={callbackUrl}/>
    <p className="auth-footer">ليس لديك حساب؟ <Link href={{ pathname: "/register", query: callbackUrl ? { callbackUrl } : {} }}>أنشئ حسابًا</Link></p>
    <Link className="guest-link" href="/demo">متابعة بدون تسجيل على هذا الجهاز فقط</Link>
  </section></main>;
}
