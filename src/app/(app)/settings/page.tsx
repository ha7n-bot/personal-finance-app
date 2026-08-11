import { googleEnabled } from "@/auth";
import { AccessibilitySettings, ThemePreference } from "@/components/accessibility-settings";
import { AppIcon } from "@/components/app-icon";
import { GoogleConnectButton } from "@/components/google-connect-button";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";
import { updateSettings } from "../financial-actions";

export default async function SettingsPage() {
  const userId = await requireUserId();
  const [user, settings, googleAccount, transactionCount, accountCount, lastTransaction] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { name: true, email: true, createdAt: true } }),
    db.settings.findUnique({ where: { userId } }),
    db.account.findFirst({ where: { userId, provider: "google" }, select: { id: true } }),
    db.transaction.count({ where: { userId } }),
    db.financialAccount.count({ where: { userId, isArchived: false } }),
    db.transaction.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
  ]);
  const googleLinked = Boolean(googleAccount);
  const lastSaved = lastTransaction?.updatedAt || user?.createdAt;

  return <div className="settings-page">
    <div className="page-heading-row"><div><span className="eyebrow">كل شيء تحت تحكمك</span><h1>الإعدادات والوضوح</h1><p className="muted">إدارة حساب الدخول والحفظ السحابي والخط والمظهر والتنبيهات.</p></div></div>

    <section className="card cloud-account-card">
      <div className="cloud-account-copy"><span className="settings-icon cloud"><AppIcon name="cloud"/></span><div><span className="eyebrow">حسابك السحابي</span><h2>{googleLinked ? "بياناتك مرتبطة بـ Google" : "بياناتك محفوظة في حساب مالي"}</h2><p>{googleLinked ? "احذف التطبيق أو استخدم جهازًا آخر، ثم ادخل بحساب Google نفسه وستعود بياناتك." : "يمكنك الدخول بالبريد الآن. اربط Google لتصبح العودة إلى بياناتك أسرع وأسهل."}</p></div></div>
      <div className="cloud-account-identity"><span className="account-avatar">{(user?.name || user?.email || "م").trim().charAt(0)}</span><div><strong>{user?.name || "مستخدم مالي"}</strong><small dir="ltr">{user?.email}</small><span className={googleLinked ? "linked" : "email-only"}><AppIcon name={googleLinked ? "check" : "info"} size={14}/>{googleLinked ? "Google مرتبط" : "الدخول بالبريد"}</span></div></div>
      <GoogleConnectButton enabled={googleEnabled} linked={googleLinked}/>
      <div className="cloud-data-stats"><div><strong>{accountCount.toLocaleString("ar-SA")}</strong><span>حساب مالي</span></div><div><strong>{transactionCount.toLocaleString("ar-SA")}</strong><span>عملية محفوظة</span></div><div><strong>{lastSaved ? lastSaved.toLocaleDateString("ar-SA") : "—"}</strong><span>آخر حفظ</span></div></div>
      <p className="cloud-explanation"><AppIcon name="lock" size={17}/><span><strong>مهم:</strong> Google يثبت هويتك ويفتح حسابك. الأرقام المالية تُحفظ في قاعدة بيانات مالي السحابية الخاصة بحسابك، وليست في Gmail أو Google Drive.</span></p>
    </section>

    <div className="settings-two-column">
      <AccessibilitySettings/>
      <section className="card settings-section appearance-section">
        <div className="settings-section-heading"><span className="settings-icon"><AppIcon name="settings"/></span><div><h2>المظهر والتنبيهات</h2><p>اختر الوضع المناسب وحدد التنبيهات التي تهمك.</p></div></div>
        <ThemePreference/>
        <form action={updateSettings} className="notification-settings-form">
          <input type="hidden" name="theme" value={settings?.theme || "system"}/>
          <strong>تنبيهات الحساب</strong>
          <label><span><AppIcon name="budget"/><b>تنبيهات الميزانية</b><small>تنبيه عند الاقتراب من الحد الشهري.</small></span><input type="checkbox" name="budgetAlerts" defaultChecked={settings?.budgetAlerts ?? true}/></label>
          <label><span><AppIcon name="calendar"/><b>تنبيهات الاستحقاق</b><small>تذكير بالفواتير والدفعات القادمة.</small></span><input type="checkbox" name="dueDateAlerts" defaultChecked={settings?.dueDateAlerts ?? true}/></label>
          <button className="btn">حفظ إعدادات التنبيه</button>
        </form>
      </section>
    </div>

    <section className="card settings-section data-details-card">
      <div className="settings-section-heading"><span className="settings-icon"><AppIcon name="info"/></span><div><h2>تفاصيل البيانات</h2><p>ملخص واضح لما يُحفظ وما لا يُحفظ.</p></div></div>
      <div className="data-detail-grid"><div><AppIcon name="cloud"/><span><strong>يُحفظ سحابيًا</strong><small>الحسابات والعمليات والميزانيات والفواتير والأهداف والتقارير.</small></span></div><div><AppIcon name="text"/><span><strong>خاص بهذا الجهاز</strong><small>حجم الخط وسُمكه والتباين؛ حتى يختار كل جهاز العرض الأنسب.</small></span></div><div><AppIcon name="lock"/><span><strong>لا نخزن كلمة مرور Google</strong><small>Google يرسل إثبات دخول آمن، ولا يحصل مالي على كلمة مرورك.</small></span></div></div>
    </section>
  </div>;
}
