"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";

export function MobileGoogleLink() {
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function link() {
      const token = new URLSearchParams(location.hash.slice(1)).get("token") || "";
      history.replaceState(null, "", "/mobile-auth/link");
      if (token.length < 32) {
        setError("رابط الربط غير صالح. ارجع إلى التطبيق وحاول مرة أخرى.");
        return;
      }

      const sessionResult = await signIn("mobile-token", { token, redirect: false });
      if (sessionResult?.error) {
        setError("انتهت صلاحية رابط الربط. ارجع إلى التطبيق وحاول مرة أخرى.");
        return;
      }

      await signIn("google", { callbackUrl: "/mobile-auth/complete" });
    }

    void link().catch(() => setError("تعذر فتح Google الآن. تحقق من الإنترنت وحاول مرة أخرى."));
  }, []);

  return <main className="auth-page"><section className="card import-card">
    <span className={error ? "" : "import-spinner"}/>
    <h1>{error ? "لم يكتمل الربط" : "تأكيد حسابك الحالي"}</h1>
    <p>{error || "نثبت حسابك بأمان ثم نفتح Google لربطه ببياناتك الحالية…"}</p>
  </section></main>;
}
