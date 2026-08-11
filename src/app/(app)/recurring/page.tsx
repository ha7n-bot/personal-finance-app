import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { db } from "@/lib/db";
import { installmentRemaining, nextInstallmentAmount } from "@/lib/installments";
import { formatSAR } from "@/lib/money";
import { requireUserId } from "@/lib/current-user";
import { recordRecurringPayment, toggleRecurring } from "../financial-actions";

export default async function RecurringPage() {
  const userId = await requireUserId();
  const rows = await db.recurringPayment.findMany({
    where: { userId },
    include: { account: true, category: true },
    orderBy: [{ active: "desc" }, { nextDueAt: "asc" }],
  });

  return <div>
    <div className="page-heading-row">
      <div><span className="eyebrow">واضحة حتى آخر دفعة</span><h1>الفواتير والأقساط</h1><p className="muted">سجّل دفعة الشهر بضغطة واحدة، وسيحسب مالي المتبقي والموعد التالي.</p></div>
      <Link className="btn" href="/transactions?type=EXPENSE&plan=MONTHLY"><AppIcon name="plus" size={18}/>إضافة فاتورة أو قسط</Link>
    </div>

    <section className="recurring-manage-list">
      {rows.map((row) => {
        const fixed = row.planType === "INSTALLMENTS" && row.totalAmount !== null && row.installmentCount !== null;
        const count = fixed ? row.installmentCount! : 0;
        const paid = fixed ? Math.min(row.completedInstallments, count) : 0;
        const completed = fixed && paid >= count;
        const remaining = fixed ? installmentRemaining(row.totalAmount!, count, paid) : null;
        const payment = fixed && !completed ? nextInstallmentAmount(row.totalAmount!, count, paid) : row.amount;
        const progress = fixed ? Math.round(paid / count * 100) : 0;
        const paused = !row.active && !completed;

        return <article className={`card recurring-plan-card ${paused ? "paused" : ""} ${completed ? "completed" : ""}`} key={row.id}>
          <div className="recurring-plan-heading">
            <span className={`recurring-plan-icon ${fixed ? "installments" : "monthly"}`}><AppIcon name={fixed ? "debt" : "repeat"}/></span>
            <div><div className="recurring-plan-labels"><span>{fixed ? "أقساط محددة" : "شهري مستمر"}</span>{completed ? <b className="status-complete">مكتمل</b> : paused ? <b className="status-paused">متوقف مؤقتًا</b> : <b className="status-active">فعّال</b>}</div><h2>{row.name}</h2><p>{row.account?.name || "الحساب غير متاح"}{row.category ? ` · ${row.category.name}` : ""}</p></div>
          </div>

          {fixed ? <div className="installment-progress-block">
            <div><strong>تم دفع {paid} من {count}</strong><span>{progress}٪</span></div>
            <div className="installment-progress" role="progressbar" aria-label={`تقدم أقساط ${row.name}`} aria-valuemin={0} aria-valuemax={count} aria-valuenow={paid}><i style={{ width: `${progress}%` }}/></div>
            <p><span>المتبقي</span><strong>{formatSAR(remaining!)}</strong></p>
          </div> : <p className="ongoing-explanation"><AppIcon name="info" size={17}/>يستمر كل شهر حتى توقفه بنفسك.</p>}

          <div className="recurring-plan-footer">
            <div><span>{completed ? "اكتمل السداد" : fixed ? `القسط القادم ${paid + 1} من ${count}` : "الدفعة القادمة"}</span><strong>{completed ? formatSAR(row.totalAmount!) : formatSAR(payment)}</strong>{!completed ? <small>الموعد تلقائيًا: {row.nextDueAt.toLocaleDateString("ar-SA")}</small> : null}</div>
            <div className="recurring-plan-actions">
              {!completed && row.active ? <form action={recordRecurringPayment}><input type="hidden" name="id" value={row.id}/><button className="btn" disabled={!row.accountId}><AppIcon name="check" size={18}/>تسجيل الدفعة</button></form> : null}
              {!completed ? <form action={toggleRecurring}><input type="hidden" name="id" value={row.id}/><button className="text-button">{row.active ? "إيقاف مؤقت" : "إعادة التفعيل"}</button></form> : null}
            </div>
          </div>
          {!row.accountId ? <p className="recurring-account-warning"><AppIcon name="info" size={17}/>لا يمكن تسجيل الدفعة لأن حسابها غير متاح. <Link href="/accounts">افتح الحسابات</Link></p> : null}
        </article>;
      })}

      {!rows.length ? <div className="card recurring-empty-state"><span><AppIcon name="repeat"/></span><h2>لا توجد فواتير أو أقساط بعد</h2><p>عند إضافة مصروف اختر «شهري مستمر» للكهرباء والاشتراكات، أو «أقساط محددة» لمبلغ ينتهي بعد عدد أشهر.</p><Link className="btn" href="/transactions?type=EXPENSE&plan=MONTHLY">إضافة أول فاتورة أو قسط</Link></div> : null}
    </section>
  </div>;
}
