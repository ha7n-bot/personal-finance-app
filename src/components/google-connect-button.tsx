"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { AppIcon } from "@/components/app-icon";

export function GoogleConnectButton({ enabled, linked, callbackUrl = "/settings" }: { enabled: boolean; linked: boolean; callbackUrl?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function connect() {
    if (!enabled || linked) return;
    setError("");
    setBusy(true);
    try {
      if (window.MaliAndroid?.openExternalAuth) {
        const response = await fetch("/api/mobile-auth/token", { method: "POST" });
        const result = await response.json() as { token?: string; error?: string };
        if (!response.ok || !result.token) throw new Error(result.error || "تعذر إنشاء رابط الربط");
        window.MaliAndroid.openExternalAuth(`${window.location.origin}/mobile-auth/link#token=${encodeURIComponent(result.token)}`);
        return;
      }
      await signIn("google", { callbackUrl });
    } catch {
      setError("تعذر فتح Google الآن. تحقق من الإنترنت وحاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  if (linked) return <div className="google-linked-status"><span><GoogleMark/></span><div><strong>حساب Google مرتبط</strong><small>يمكنك تسجيل الدخول بنفس الحساب واستعادة بياناتك على أي جهاز.</small></div><AppIcon name="check"/></div>;

  return <div>
    <button className="google-connect-button" type="button" onClick={connect} disabled={!enabled || busy}>
      <GoogleMark/>
      <span><strong>{busy ? "جارٍ فتح Google…" : "ربط حساب Google"}</strong><small>{enabled ? "دخول سريع واسترجاع بياناتك من أي جهاز" : "يحتاج إكمال إعداد Google على الخادم"}</small></span>
    </button>
    {error ? <p className="auth-error" role="alert">{error}</p> : null}
  </div>;
}

export function GoogleMark({ size = 22 }: { size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"/><path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.64-2.36l-3.24-2.54c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.55l3.35-2.62Z"/><path fill="#EA4335" d="M12 5.94c1.47 0 2.79.51 3.83 1.5l2.88-2.88A9.68 9.68 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"/></svg>;
}
