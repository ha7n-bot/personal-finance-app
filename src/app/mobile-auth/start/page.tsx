"use client";
import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
export default function MobileAuthStart() { const started = useRef(false); useEffect(() => { if (started.current) return; started.current = true; void signIn("google", { callbackUrl: "/mobile-auth/complete" }); }, []); return <main className="auth-page"><section className="card import-card"><span className="import-spinner"/><h1>فتح تسجيل Google</h1><p>سيعود بك المتصفح إلى تطبيق مالي بعد اختيار الحساب.</p></section></main>; }
