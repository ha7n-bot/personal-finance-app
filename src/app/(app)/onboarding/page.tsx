import { auth } from "@/auth";
import { AppIcon } from "@/components/app-icon";
import { completeOnboarding } from "./actions";

export default async function Onboarding() {
  const session = await auth();
  return <div className="onboarding-wrap">
    <section className="onboarding-layout">
      <aside className="card onboarding-guide">
        <span className="setup-badge">إعداد أول مرة</span>
        <h1>أهلًا {session?.user?.name || "بك"}، لنرتّب مالي معًا</h1>
        <p>لن نطلب منك كل شيء الآن. نبدأ بمكان وجود مالك، وبعدها يقودك التطبيق للخطوة التالية.</p>
        <div className="onboarding-roadmap">
          <div className="active"><b><AppIcon name="accounts"/></b><span><strong>١. حسابك الأساسي</strong><small>البنك أو النقد والرصيد الحالي.</small></span></div>
          <div><b><AppIcon name="income"/></b><span><strong>٢. أول دخل أو مصروف</strong><small>مثلاً الراتب أو فاتورة الكهرباء.</small></span></div>
          <div><b><AppIcon name="reports"/></b><span><strong>٣. شاهد الصورة كاملة</strong><small>تظهر التقارير تلقائيًا من عملياتك.</small></span></div>
        </div>
        <div className="onboarding-cloud-note"><AppIcon name="cloud"/><span><strong>حفظ تلقائي</strong><small>ما تسجله بعد الدخول يُحفظ في حسابك السحابي ويعود عند تسجيل الدخول من جهاز آخر.</small></span></div>
      </aside>

      <form action={completeOnboarding} className="card onboarding-card">
        <div className="onboarding-card-heading"><span>الخطوة ١ من ٣</span><h2>أين يوجد مالك الآن؟</h2><p>الحساب هنا لا يعني حساب الدخول؛ بل المكان المالي الذي تختاره عند تسجيل أي عملية.</p></div>
        <label className="field-label"><span>اسم الحساب <small>اسم سهل تعرفه لاحقًا</small></span><input className="field" name="name" required minLength={2} defaultValue="حسابي الرئيسي" placeholder="مثال: حساب الراتب"/></label>
        <fieldset className="account-type-picker"><legend>نوع الحساب</legend>
          <label><input type="radio" name="type" value="BANK" defaultChecked/><span><AppIcon name="accounts"/><strong>بنكي</strong><small>حساب راتب أو جارٍ</small></span></label>
          <label><input type="radio" name="type" value="CASH"/><span><AppIcon name="budget"/><strong>نقدي</strong><small>المحفظة أو الكاش</small></span></label>
          <label><input type="radio" name="type" value="SAVINGS"/><span><AppIcon name="shield"/><strong>ادخار</strong><small>مبلغ مخصص للادخار</small></span></label>
          <label><input type="radio" name="type" value="INVESTMENT"/><span><AppIcon name="investment"/><strong>استثمار</strong><small>محفظة استثمارية</small></span></label>
        </fieldset>
        <label className="field-label"><span>الرصيد الحالي <small>اكتب صفرًا إذا أردت البدء من اليوم</small></span><div className="amount-field"><input className="field number-input" name="balance" type="number" min="0" step="0.01" defaultValue="0" inputMode="decimal"/><b>ر.س</b></div></label>
        <p className="onboarding-help"><AppIcon name="info" size={17}/>يمكنك تغيير الاسم أو إضافة حسابات أخرى لاحقًا من صفحة الحسابات.</p>
        <button className="btn w-full">حفظ الحساب والانتقال للخطوة التالية <AppIcon name="arrow" size={18}/></button>
      </form>
    </section>
  </div>;
}
