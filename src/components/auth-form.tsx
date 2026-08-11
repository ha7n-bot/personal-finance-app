"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppIcon } from "@/components/app-icon";
import { GoogleMark } from "@/components/google-connect-button";

export function AuthForm({ mode, googleEnabled, callbackUrl, initialError = "" }: { mode: "login" | "register"; googleEnabled: boolean; callbackUrl?: string; initialError?: string }) {
  const router = useRouter();
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);

  async function continueWithGoogle() {
    setError(""); setBusy(true);
    try {
      if (window.MaliAndroid?.openExternalAuth) {
        window.MaliAndroid.openExternalAuth(`${window.location.origin}/mobile-auth/start`);
        return;
      }
      await signIn("google", { callbackUrl: callbackUrl || "/dashboard" });
    } catch { setError("تعذر فتح تسجيل Google الآن؛ حاول مرة أخرى."); }
    finally { setBusy(false); }
  }

  async function submit(formData: FormData) {
    setError(""); setBusy(true);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    try {
      if (mode === "register") {
        const response = await fetch("/api/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: formData.get("name"), email, password }) });
        if (!response.ok) { setError((await response.json()).error || "تعذر إنشاء الحساب"); return; }
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) { setError("البريد الإلكتروني أو كلمة المرور غير صحيحة"); return; }
      router.push(callbackUrl || (mode === "register" ? "/onboarding" : "/dashboard"));
      router.refresh();
    } catch { setError("تعذر الاتصال بالخدمة الآن؛ تحقق من الإنترنت ثم حاول مرة أخرى."); }
    finally { setBusy(false); }
  }

  return <div className="auth-options">
    <section className="google-auth-panel">
      <span className="recommended-badge"><AppIcon name="cloud" size={16}/>الخيار الموصى به</span>
      <button className="google-button" type="button" onClick={continueWithGoogle} disabled={busy || !googleEnabled}>
        <span className="google-mark-wrap"><GoogleMark size={24}/></span>
        <span><strong>{busy ? "جارٍ فتح Google…" : "المتابعة باستخدام Google"}</strong><small>حساب واحد يحفظ بياناتك ويعيدها على الجوال والويب</small></span>
        <AppIcon name="arrow" size={19}/>
      </button>
      {!googleEnabled ? <p className="auth-provider-notice"><AppIcon name="info" size={17}/>ربط Google غير مكتمل على الخادم حاليًا. يمكنك استخدام البريد مؤقتًا إلى أن يكتمل التفعيل.</p> : null}
      <div className="cloud-assurances"><span><AppIcon name="sync" size={16}/>حفظ تلقائي</span><span><AppIcon name="lock" size={16}/>بيانات خاصة بك</span><span><AppIcon name="accounts" size={16}/>تعمل على أكثر من جهاز</span></div>
    </section>
    {error ? <p className="auth-error" role="alert">{error}</p> : null}

    <details className="email-auth" open={!googleEnabled}>
      <summary><span>الدخول بالبريد وكلمة المرور</span><small>خيار بديل</small></summary>
      <form action={submit} className="auth-email-form">
        {mode === "register" ? <label className="auth-field"><span>الاسم</span><input className="field" name="name" autoComplete="name" required minLength={2} placeholder="اسمك"/></label> : null}
        <label className="auth-field"><span>البريد الإلكتروني</span><input className="field" name="email" type="email" inputMode="email" autoComplete="email" required placeholder="name@example.com" dir="ltr"/></label>
        <label className="auth-field"><span>كلمة المرور</span><input className="field" name="password" type="password" minLength={8} maxLength={72} autoComplete={mode === "login" ? "current-password" : "new-password"} required placeholder="8 أحرف على الأقل"/></label>
        <button className="btn w-full" disabled={busy}>{busy ? "جارٍ المتابعة…" : mode === "login" ? "تسجيل الدخول بالبريد" : "إنشاء الحساب بالبريد"}</button>
      </form>
    </details>
  </div>;
}
