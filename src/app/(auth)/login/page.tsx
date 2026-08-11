import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthPageShell } from "@/components/auth-page-shell";
import { googleEnabled } from "@/auth";

export default async function Login({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const params = await searchParams;
  const requested = params.callbackUrl;
  const callbackUrl = requested?.startsWith("/") && !requested.startsWith("//") ? requested : undefined;
  const initialError = params.error === "OAuthAccountNotLinked"
    ? "يوجد حساب بالبريد نفسه. ادخل بالبريد وكلمة المرور أولًا، ثم اربط Google بأمان من الإعدادات."
    : params.error ? "لم يكتمل تسجيل الدخول. أعد المحاولة واختر حساب Google الصحيح." : "";
  return <AuthPageShell eyebrow="مرحبًا بعودتك" title="دخول إلى حسابك" intro="اختر Google للدخول السريع واستعادة بياناتك تلقائيًا على أي جهاز." footer={<><p>ليس لديك حساب؟ <Link href={{ pathname: "/register", query: callbackUrl ? { callbackUrl } : {} }}>أنشئ حسابًا</Link></p><Link className="guest-link" href="/demo">تجربة محلية بدون حفظ سحابي</Link></>}>
    <AuthForm mode="login" googleEnabled={googleEnabled} callbackUrl={callbackUrl} initialError={initialError}/>
  </AuthPageShell>;
}
