"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode, googleEnabled, callbackUrl }: { mode: "login" | "register"; googleEnabled: boolean; callbackUrl?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
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
    {googleEnabled ? <><button className="google-button" type="button" onClick={continueWithGoogle} disabled={busy}><GoogleMark/>المتابعة باستخدام Google</button><div className="auth-divider"><span>أو بالبريد الإلكتروني</span></div></> : null}
    <form action={submit} className="space-y-4">
      {mode === "register" ? <label className="auth-field"><span>الاسم</span><input className="field" name="name" autoComplete="name" required minLength={2} placeholder="اسمك"/></label> : null}
      <label className="auth-field"><span>البريد الإلكتروني</span><input className="field" name="email" type="email" inputMode="email" autoComplete="email" required placeholder="name@example.com" dir="ltr"/></label>
      <label className="auth-field"><span>كلمة المرور</span><input className="field" name="password" type="password" minLength={8} maxLength={72} autoComplete={mode === "login" ? "current-password" : "new-password"} required placeholder="8 أحرف على الأقل"/></label>
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
      <button className="btn w-full" disabled={busy}>{busy ? "جارٍ المتابعة…" : mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}</button>
    </form>
  </div>;
}

function GoogleMark() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"/><path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.64-2.36l-3.24-2.54c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.55l3.35-2.62Z"/><path fill="#EA4335" d="M12 5.94c1.47 0 2.79.51 3.83 1.5l2.88-2.88A9.68 9.68 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"/></svg>;
}
