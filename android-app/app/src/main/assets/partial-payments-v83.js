(() => {
  if (window.__maliPartialPaymentsV83) return;
  window.__maliPartialPaymentsV83 = true;

  const $ = (id) => document.getElementById(id);
  const q = (s, root = document) => root.querySelector(s);
  const whole = (v) => Math.round(Number(v) || 0);
  const makeId = () => typeof id === 'function' ? id() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const todayLocal = () => typeof today === 'function' ? today() : new Date().toISOString().slice(0, 10);
  const currentMonth = () => typeof monthKey === 'function' ? monthKey() : todayLocal().slice(0, 7);
  const riyal = (v) => `${new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(whole(v))} ر.س`;
  const escapeHtml = (v) => typeof esc === 'function' ? esc(v) : String(v ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function persistOnly() {
    try {
      localStorage.setItem(K, JSON.stringify(state));
      window.MaliAndroid?.persistFinanceData?.(JSON.stringify(state));
    } catch (_) {}
  }

  function ensureState() {
    state.settings = state.settings || {};
    if (!Array.isArray(state.planPayments)) state.planPayments = [];
    if (state.settings.partialPaymentsV83) return;

    const existingKeys = new Set(state.planPayments.map((p) => `${p.planId}|${p.month}|${p.transactionId || ''}`));
    (state.plans || []).filter((p) => p.kind === 'monthly').forEach((plan) => {
      (plan.paidMonths || []).forEach((month) => {
        const matching = (state.transactions || []).find((t) => t.source === `plan:${plan.id}:${month}`);
        const key = `${plan.id}|${month}|${matching?.id || ''}`;
        if (existingKeys.has(key)) return;
        const dueDay = String(Math.max(1, Math.min(28, whole(plan.dueDay || 1)))).padStart(2, '0');
        state.planPayments.push({
          id: `legacy-${plan.id}-${month}`,
          planId: plan.id,
          month,
          amount: whole(matching?.amount ?? plan.amount),
          date: matching?.date || `${month}-${dueDay}`,
          accountId: matching?.accountId || plan.accountId || '',
          note: 'سداد سابق قبل نظام الدفعات الجزئية',
          transactionId: matching?.id || null,
          legacy: true
        });
      });
    });

    state.settings.partialPaymentsV83 = true;
    persistOnly();
  }

  function paymentsFor(planId, month = currentMonth()) {
    return (state.planPayments || [])
      .filter((p) => p.planId === planId && p.month === month)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }

  function paidForMonth(plan, month = currentMonth()) {
    return paymentsFor(plan.id, month).reduce((sum, p) => sum + whole(p.amount), 0);
  }

  function monthlyTarget(plan) {
    return Math.max(0, whole(plan.amount));
  }

  function monthlyRemaining(plan, month = currentMonth()) {
    return Math.max(0, monthlyTarget(plan) - paidForMonth(plan, month));
  }

  function syncLegacyPaidMonth(plan, month) {
    if (!Array.isArray(plan.paidMonths)) plan.paidMonths = [];
    const complete = paidForMonth(plan, month) >= monthlyTarget(plan) && monthlyTarget(plan) > 0;
    const has = plan.paidMonths.includes(month);
    if (complete && !has) plan.paidMonths.push(month);
    if (!complete && has) plan.paidMonths = plan.paidMonths.filter((m) => m !== month);
  }

  const oldDueThisMonth = typeof dueThisMonth === 'function' ? dueThisMonth : null;
  dueThisMonth = function () {
    const month = currentMonth();
    return (state.plans || []).filter((p) => typeof planActive !== 'function' || planActive(p, month)).reduce((sum, plan) => {
      if (plan.kind === 'monthly') return sum + monthlyRemaining(plan, month);
      if (plan.kind === 'installment') {
        const paid = Array.isArray(plan.paidMonths) && plan.paidMonths.includes(month);
        return sum + (paid ? 0 : whole(typeof planAmount === 'function' ? planAmount(plan) : plan.amount));
      }
      return sum;
    }, 0);
  };

  function injectStyles() {
    if ($('mali-v83-style')) return;
    const style = document.createElement('style');
    style.id = 'mali-v83-style';
    style.textContent = `
      .v83-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
      .v83-summary>div{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:12px;box-shadow:0 6px 18px rgba(12,60,48,.05)}
      .v83-summary span{display:block;color:var(--muted);font-size:.63rem}.v83-summary strong{display:block;margin-top:5px;font-size:.86rem}
      .v83-guide{background:color-mix(in srgb,var(--accent) 9%,var(--card));border:1px solid color-mix(in srgb,var(--accent) 24%,var(--line));border-radius:16px;padding:12px 13px;margin-bottom:12px;color:var(--muted);font-size:.7rem;line-height:1.75}.v83-guide b{color:var(--text)}
      .v83-plan{border:1px solid var(--line);background:var(--card);border-radius:19px;padding:14px;margin-bottom:10px;box-shadow:0 7px 20px rgba(12,60,48,.05)}
      .v83-plan-head{display:grid;grid-template-columns:42px 1fr auto;gap:10px;align-items:start}.v83-plan-icon{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:var(--card2);font-size:1.15rem}.v83-plan h4{margin:0;font-size:.92rem}.v83-plan-meta{color:var(--muted);font-size:.68rem;margin-top:3px;line-height:1.6}
      .v83-state{padding:5px 8px;border-radius:99px;background:var(--card2);color:var(--muted);font-size:.62rem;font-weight:900}.v83-state.partial{background:color-mix(in srgb,var(--warn) 13%,var(--card));color:var(--warn)}.v83-state.done{background:color-mix(in srgb,var(--accent) 13%,var(--card));color:var(--accent)}.v83-state.over{background:color-mix(in srgb,var(--info) 13%,var(--card));color:var(--info)}
      .v83-progress{height:9px;border-radius:99px;background:var(--line);overflow:hidden;margin:12px 0 8px}.v83-progress i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--accent),#4bd7ae)}
      .v83-numbers{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.v83-num{background:var(--card2);border-radius:12px;padding:9px}.v83-num span{display:block;color:var(--muted);font-size:.59rem}.v83-num strong{display:block;font-size:.75rem;margin-top:3px}
      .v83-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.v83-actions .btn{flex:1;min-width:135px;min-height:42px;padding:10px}.v83-actions .mini{min-height:38px}
      .v83-payments{margin-top:11px;padding-top:10px;border-top:1px dashed var(--line);display:grid;gap:6px}.v83-pay-row{display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;background:var(--card2);border-radius:11px;padding:8px 9px}.v83-pay-row strong{font-size:.72rem}.v83-pay-row small{display:block;color:var(--muted);font-size:.6rem;margin-top:2px}.v83-pay-row b{font-size:.72rem;white-space:nowrap}
      .v83-modal{position:fixed;inset:0;z-index:240;background:rgba(0,0,0,.48);display:grid;align-items:end;padding:12px}.v83-modal.hidden{display:none!important}.v83-sheet{width:100%;max-width:640px;max-height:90vh;overflow:auto;margin:auto;background:var(--card);border:1px solid var(--line);border-radius:24px 24px 18px 18px;padding:17px;color:var(--text)}.v83-sheet-head{display:flex;justify-content:space-between;align-items:start;gap:10px;margin-bottom:13px}.v83-sheet-head h3{margin:0;font-size:1rem}.v83-sheet-head p{margin:4px 0 0;color:var(--muted);font-size:.68rem}.v83-close{border:0;background:var(--card2);color:var(--text);width:38px;height:38px;border-radius:12px;font-size:1.2rem}
      .v83-preview{border:1px solid var(--line);background:var(--card2);padding:11px 12px;border-radius:13px;font-size:.7rem;line-height:1.7;color:var(--muted)}.v83-preview b{color:var(--text)}
      @media(max-width:520px){.v83-summary{grid-template-columns:1fr 1fr}.v83-numbers{grid-template-columns:1fr 1fr}.v83-plan-head{grid-template-columns:38px 1fr auto}.v83-plan-icon{width:38px;height:38px}.v83-pay-row{grid-template-columns:1fr auto}.v83-pay-row .mini{grid-column:1/3;justify-self:stretch}}
    `;
    document.head.appendChild(style);
  }

  function ensurePlanUi() {
    const page = q('[data-page="plans"]');
    if (!page) return;
    const heading = q('.heading', page);
    if (heading && !$('v83PlanIntro')) {
      heading.insertAdjacentHTML('afterend', `
        <div id="v83PlanIntro">
          <div class="v83-guide"><b>صار الالتزام الشهري مرنًا:</b> لو البنزين 350 ريال بالشهر، سجّل 50 أو 60 أو 70 كل مرة. مالي يجمعها لك ويعرض المدفوع والمتبقي. وإذا نسيت دفعة، اختر تاريخ الدفع السابق عند تسجيلها.</div>
          <div class="v83-summary" id="v83PlanSummary"></div>
        </div>`);
    }
    if (!$('v83PaymentModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div class="v83-modal hidden" id="v83PaymentModal">
          <div class="v83-sheet">
            <div class="v83-sheet-head"><div><h3 id="v83PaymentTitle">تسجيل دفعة</h3><p id="v83PaymentSubtitle"></p></div><button class="v83-close" type="button" onclick="closeMonthlyPayment()">×</button></div>
            <form class="form" id="v83PaymentForm">
              <input type="hidden" id="v83PlanId">
              <label class="label">المبلغ الذي دفعته الآن<input class="field" id="v83PaymentAmount" type="number" inputmode="numeric" min="1" step="1" required placeholder="مثال 50"></label>
              <label class="label">تاريخ الدفع <small style="font-weight:400;color:var(--muted)">لو نسيت دفعة سابقة اختر تاريخها الحقيقي</small><input class="field" id="v83PaymentDate" type="date" required></label>
              <label class="label">من أي حساب دفعت؟<select class="field" id="v83PaymentAccount" required></select></label>
              <label class="label">ملاحظة اختيارية<input class="field" id="v83PaymentNote" placeholder="مثال تعبئة بنزين"></label>
              <div class="v83-preview" id="v83PaymentPreview"></div>
              <button class="btn" type="submit">حفظ الدفعة وخصمها من الحساب</button>
              <button class="btn secondary" type="button" onclick="closeMonthlyPayment()">إلغاء</button>
            </form>
          </div>
        </div>`);
      $('v83PaymentForm')?.addEventListener('submit', saveMonthlyPayment);
      $('v83PaymentAmount')?.addEventListener('input', updatePaymentPreview);
      $('v83PaymentDate')?.addEventListener('change', updatePaymentPreview);
    }
  }

  function planStatus(plan, month) {
    const target = monthlyTarget(plan), paid = paidForMonth(plan, month);
    if (paid > target && target > 0) return ['تجاوز الهدف', 'over'];
    if (paid >= target && target > 0) return ['مكتمل', 'done'];
    if (paid > 0) return ['مدفوع جزئيًا', 'partial'];
    return ['مستحق', ''];
  }

  function monthlyPlanHtml(plan, month) {
    const target = monthlyTarget(plan), paid = paidForMonth(plan, month), remaining = Math.max(0, target - paid), over = Math.max(0, paid - target);
    const pct = target > 0 ? Math.min(100, paid / target * 100) : 0;
    const [status, cls] = planStatus(plan, month);
    const category = typeof catBy === 'function' ? catBy(plan.categoryId) : { icon: '📅', name: 'التزام شهري' };
    const payments = paymentsFor(plan.id, month);
    const paymentRows = payments.length ? `<div class="v83-payments"><div class="v83-plan-meta">دفعات هذا الشهر</div>${payments.map((payment) => `<div class="v83-pay-row"><div><strong>${escapeHtml(payment.note || 'دفعة')}</strong><small>${escapeHtml(payment.date || '')}${payment.legacy ? ' · مسجل سابقًا' : ''}</small></div><b>${riyal(payment.amount)}</b><button class="mini danger" onclick="deleteMonthlyPayment('${payment.id}')">حذف الدفعة</button></div>`).join('')}</div>` : '';
    return `<div class="v83-plan"><div class="v83-plan-head"><span class="v83-plan-icon">${category.icon || '📅'}</span><div><h4>${escapeHtml(plan.title)}</h4><div class="v83-plan-meta">الهدف الشهري ${riyal(target)} · ${escapeHtml(category.name || 'التزام')}</div></div><span class="v83-state ${cls}">${status}</span></div><div class="v83-progress"><i style="width:${pct}%"></i></div><div class="v83-numbers"><div class="v83-num"><span>المطلوب</span><strong>${riyal(target)}</strong></div><div class="v83-num"><span>دفعت</span><strong class="positive">${riyal(paid)}</strong></div><div class="v83-num"><span>${over > 0 ? 'تجاوزت بـ' : 'المتبقي'}</span><strong class="${over > 0 ? 'negative' : ''}">${riyal(over > 0 ? over : remaining)}</strong></div></div><div class="v83-actions"><button class="btn" onclick="openMonthlyPayment('${plan.id}')">＋ تسجيل دفعة</button><button class="mini" onclick="editPlan('${plan.id}')">تعديل</button><button class="mini danger" onclick="deletePlan('${plan.id}')">حذف</button></div>${paymentRows}</div>`;
  }

  function installmentPlanHtml(plan, month) {
    const monthly = whole(typeof planAmount === 'function' ? planAmount(plan) : plan.amount), paid = Array.isArray(plan.paidMonths) && plan.paidMonths.includes(month), paidCount = (plan.paidMonths || []).length;
    const total = whole(plan.totalAmount), remaining = Math.max(0, total - (plan.paidMonths || []).reduce((sum, m) => sum + (m ? monthly : 0), 0));
    const progress = Math.min(100, paidCount / Math.max(1, whole(plan.months)) * 100);
    return `<div class="v83-plan"><div class="v83-plan-head"><span class="v83-plan-icon">🧾</span><div><h4>${escapeHtml(plan.title)}</h4><div class="v83-plan-meta">قسط ${riyal(monthly)} · ${paidCount} من ${whole(plan.months)} أشهر · المتبقي تقريبًا ${riyal(remaining)}</div></div><span class="v83-state ${paid ? 'done' : ''}">${paid ? 'مدفوع' : 'مستحق'}</span></div><div class="v83-progress"><i style="width:${progress}%"></i></div><div class="v83-actions"><button class="btn ${paid ? 'secondary' : ''}" onclick="togglePay('${plan.id}')">${paid ? 'إلغاء سداد هذا الشهر' : 'تسجيل قسط هذا الشهر'}</button><button class="mini" onclick="editPlan('${plan.id}')">تعديل</button><button class="mini danger" onclick="deletePlan('${plan.id}')">حذف</button></div></div>`;
  }

  renderPlans = function () {
    ensureState(); ensurePlanUi();
    const month = currentMonth();
    const active = (state.plans || []).filter((p) => typeof planActive !== 'function' || planActive(p, month));
    const totalPlanned = active.reduce((sum, p) => sum + whole(typeof planAmount === 'function' ? planAmount(p) : p.amount), 0);
    const paid = active.reduce((sum, p) => {
      if (p.kind === 'monthly') return sum + paidForMonth(p, month);
      return sum + ((p.paidMonths || []).includes(month) ? whole(typeof planAmount === 'function' ? planAmount(p) : p.amount) : 0);
    }, 0);
    const due = dueThisMonth();
    const completed = active.filter((p) => p.kind === 'monthly' ? monthlyRemaining(p, month) === 0 && monthlyTarget(p) > 0 : (p.paidMonths || []).includes(month)).length;
    if ($('planMonth')) $('planMonth').textContent = new Intl.DateTimeFormat('ar-SA', { month: 'long', year: 'numeric' }).format(new Date());
    if ($('planDue')) $('planDue').textContent = riyal(due);
    if ($('v83PlanSummary')) $('v83PlanSummary').innerHTML = `<div><span>المخطط للشهر</span><strong>${riyal(totalPlanned)}</strong></div><div><span>سجلت مدفوع</span><strong class="positive">${riyal(paid)}</strong></div><div><span>المتبقي</span><strong class="negative">${riyal(due)}</strong></div><div><span>مكتمل</span><strong>${completed} من ${active.length}</strong></div>`;
    if ($('planList')) $('planList').innerHTML = active.length ? active.map((p) => p.kind === 'monthly' ? monthlyPlanHtml(p, month) : installmentPlanHtml(p, month)).join('') : (typeof emptyHtml === 'function' ? emptyHtml('لا توجد التزامات هذا الشهر', 'أضف التزامًا شهريًا أو أقساطًا من شاشة العمليات') : '<div class="empty">لا توجد التزامات</div>');
  };

  window.openMonthlyPayment = function (planId) {
    ensurePlanUi();
    const plan = (state.plans || []).find((p) => p.id === planId && p.kind === 'monthly');
    if (!plan) return;
    $('v83PlanId').value = plan.id;
    $('v83PaymentTitle').textContent = `تسجيل دفعة — ${plan.title}`;
    $('v83PaymentDate').value = todayLocal();
    $('v83PaymentAmount').value = '';
    $('v83PaymentNote').value = '';
    const accountSelect = $('v83PaymentAccount');
    accountSelect.innerHTML = (state.accounts || []).length ? state.accounts.map((a) => `<option value="${a.id}">${escapeHtml(a.name)} · ${riyal(typeof balance === 'function' ? balance(a) : a.openingBalance)}</option>`).join('') : '<option value="">أضف حسابًا أولًا</option>';
    if (plan.accountId && (state.accounts || []).some((a) => a.id === plan.accountId)) accountSelect.value = plan.accountId;
    $('v83PaymentModal').classList.remove('hidden');
    updatePaymentPreview();
    setTimeout(() => $('v83PaymentAmount')?.focus(), 40);
  };

  window.closeMonthlyPayment = function () { $('v83PaymentModal')?.classList.add('hidden'); };

  function updatePaymentPreview() {
    const plan = (state.plans || []).find((p) => p.id === $('v83PlanId')?.value);
    if (!plan) return;
    const amount = whole($('v83PaymentAmount')?.value), date = $('v83PaymentDate')?.value || todayLocal(), month = date.slice(0, 7), before = paidForMonth(plan, month), target = monthlyTarget(plan), after = before + amount, remaining = Math.max(0, target - after), over = Math.max(0, after - target);
    if ($('v83PaymentSubtitle')) $('v83PaymentSubtitle').textContent = `هدف الشهر ${riyal(target)} · مدفوع قبل هذه الدفعة ${riyal(before)}`;
    if ($('v83PaymentPreview')) $('v83PaymentPreview').innerHTML = amount > 0 ? `<b>بعد تسجيل ${riyal(amount)}</b><br>إجمالي المدفوع سيصبح ${riyal(after)} · ${over > 0 ? `ستتجاوز الهدف بـ ${riyal(over)}` : `سيتبقى ${riyal(remaining)}`}` : `اكتب المبلغ الذي دفعته فعلًا، مثل 50 أو 60 ريال. يمكنك اختيار تاريخ سابق إذا نسيت تسجيل الدفعة وقتها.`;
  }

  function saveMonthlyPayment(event) {
    event.preventDefault();
    const plan = (state.plans || []).find((p) => p.id === $('v83PlanId')?.value && p.kind === 'monthly');
    if (!plan) return toast('تعذر العثور على الالتزام');
    const amount = whole($('v83PaymentAmount').value), date = $('v83PaymentDate').value || todayLocal(), accountId = $('v83PaymentAccount').value, note = $('v83PaymentNote').value.trim();
    if (amount <= 0) return toast('أدخل مبلغ الدفعة بالريال الكامل');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return toast('اختر تاريخ دفع صحيحًا');
    if (!(state.accounts || []).some((a) => a.id === accountId)) return toast('اختر الحساب الذي دفعت منه');
    const paymentId = makeId(), month = date.slice(0, 7), transactionId = makeId();
    state.planPayments.unshift({ id: paymentId, planId: plan.id, month, amount, date, accountId, note: note || 'دفعة التزام شهري', transactionId, legacy: false });
    state.transactions.unshift({ id: transactionId, title: plan.title, amount, kind: 'expense', accountId, categoryId: plan.categoryId, date, note: note || 'دفعة جزئية لالتزام شهري', source: `planpay:${paymentId}` });
    syncLegacyPaidMonth(plan, month);
    closeMonthlyPayment();
    save();
    toast(`تم تسجيل ${riyal(amount)} · المتبقي ${riyal(monthlyRemaining(plan, month))}`);
  }

  window.deleteMonthlyPayment = function (paymentId) {
    const payment = (state.planPayments || []).find((p) => p.id === paymentId);
    if (!payment) return;
    if (!confirm(`حذف دفعة ${riyal(payment.amount)}؟ سيتم حذف المصروف المرتبط بها من سجل العمليات أيضًا`)) return;
    const plan = (state.plans || []).find((p) => p.id === payment.planId);
    state.planPayments = state.planPayments.filter((p) => p.id !== paymentId);
    if (payment.transactionId) state.transactions = state.transactions.filter((t) => t.id !== payment.transactionId);
    state.transactions = state.transactions.filter((t) => t.source !== `planpay:${paymentId}`);
    if (plan) syncLegacyPaidMonth(plan, payment.month);
    save(); toast('تم حذف الدفعة وتحديث المتبقي');
  };

  const oldTogglePay = typeof togglePay === 'function' ? togglePay : null;
  togglePay = function (planId) {
    const plan = (state.plans || []).find((p) => p.id === planId);
    if (plan?.kind === 'monthly') return openMonthlyPayment(planId);
    if (oldTogglePay) return oldTogglePay(planId);
  };

  const oldDeletePlan = typeof deletePlan === 'function' ? deletePlan : null;
  deletePlan = function (planId) {
    const plan = (state.plans || []).find((p) => p.id === planId);
    if (!plan) return oldDeletePlan?.(planId);
    if (!confirm('حذف الالتزام؟ العمليات والدفعات المسجلة سابقًا ستبقى في سجل العمليات')) return;
    state.plans = state.plans.filter((p) => p.id !== planId);
    state.planPayments = (state.planPayments || []).filter((p) => p.planId !== planId);
    save();
  };

  function patchImport() {
    if (!window.MaliApp?.receiveImportedData || window.__maliV83ImportPatched) return;
    window.__maliV83ImportPatched = true;
    const original = window.MaliApp.receiveImportedData.bind(window.MaliApp);
    window.MaliApp.receiveImportedData = function (raw) {
      original(raw);
      setTimeout(() => { ensureState(); render(); }, 0);
    };
  }

  function init() {
    ensureState(); injectStyles(); ensurePlanUi(); patchImport();
    if (oldDueThisMonth && typeof oldDueThisMonth !== 'function') void oldDueThisMonth;
    render();
  }

  init();
})();
