import { completeOnboarding } from "./actions";

export default function Onboarding() {
  return <div className="onboarding-wrap"><form action={completeOnboarding} className="card onboarding-card">
    <span className="setup-badge">إعداد سريع</span><h1>لنبدأ بحسابك الأول</h1><p className="muted">الحساب هو المكان الذي يوجد فيه مالك، مثل البنك أو النقد. يمكن أن يكون الرصيد صفرًا.</p>
    <label className="field-label"><span>اسم الحساب</span><input className="field" name="name" required minLength={2} defaultValue="حسابي الرئيسي"/></label>
    <label className="field-label"><span>نوع الحساب</span><select className="field" name="type" defaultValue="BANK"><option value="BANK">حساب بنكي</option><option value="CASH">نقدي</option><option value="SAVINGS">ادخار</option><option value="INVESTMENT">استثمار</option></select></label>
    <label className="field-label"><span>الرصيد الحالي <small>يمكن أن يكون صفرًا</small></span><input className="field number-input" name="balance" type="number" min="0" step="0.01" defaultValue="0"/></label>
    <button className="btn w-full">حفظ والمتابعة</button>
  </form></div>;
}
