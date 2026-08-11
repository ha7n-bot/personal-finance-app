import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthPageShell } from "@/components/auth-page-shell";
import { googleEnabled } from "@/auth";

export default async function Register({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const params = await searchParams;
  const requested = params.callbackUrl;
  const callbackUrl = requested?.startsWith("/") && !requested.startsWith("//") ? requested : undefined;
  const initialError = params.error === "OAuthAccountNotLinked"
    ? "هذا البريد مسجل مسبقًا. ادخل بالبريد وكلمة المرور، ثم اربط Google بأمان من الإعدادات."
    : params.error ? "لم يكتمل إنشاء الحساب باستخدام Google. أعد المحاولة." : "";
  return <AuthPageShell eyebrow="ابدأ بخطوات بسيطة" title="إنشاء حساب مالي" intro="Google هو الطريق الأسرع: ضغطة واحدة، ثم تبقى بياناتك مرتبطة بحسابك." footer={<p>لديك حساب؟ <Link href={{ pathname: "/login", query: callbackUrl ? { callbackUrl } : {} }}>سجّل الدخول</Link></p>}>
    <AuthForm mode="register" googleEnabled={googleEnabled} callbackUrl={callbackUrl} initialError={initialError}/>
  </AuthPageShell>;
}
