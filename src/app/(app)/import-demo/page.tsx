"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { restoreDemoState, STORAGE_KEY } from "@/lib/demo-store";

export default function ImportDemoPage() {
  const router = useRouter(); const started = useRef(false); const [status, setStatus] = useState("نجهّز بياناتك للمزامنة…"); const [error, setError] = useState("");
  useEffect(() => { if (started.current) return; started.current = true;
    async function run() { try { const stored = localStorage.getItem(STORAGE_KEY); const state = stored ? restoreDemoState(JSON.parse(stored)) : null; if (!state || (!state.accounts.length && !state.transactions.length && !state.budgets.length && !state.commitments.length)) { router.replace("/onboarding"); return; }
      setStatus("يتم نقل الحسابات والعمليات والميزانيات إلى حسابك…"); const response = await fetch("/api/import-demo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(state) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "تعذر استيراد البيانات"); if (!result.alreadyImported) localStorage.removeItem(STORAGE_KEY); setStatus("اكتملت المزامنة، نفتح لوحتك الآن…"); router.replace("/dashboard"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "حدث خطأ غير متوقع"); } }
    void run();
  }, [router]);
  return <div className="onboarding-wrap"><section className="card import-card"><span className="import-spinner"/><h1>{error ? "لم تكتمل المزامنة" : "نقل بياناتك بأمان"}</h1><p>{error || status}</p>{error ? <div className="import-actions"><button className="btn" onClick={() => location.reload()}>إعادة المحاولة</button><Link className="secondary-button" href="/demo">العودة للنسخة المحلية</Link></div> : <small>لا تغلق الصفحة حتى تنتهي العملية.</small>}</section></div>;
}
