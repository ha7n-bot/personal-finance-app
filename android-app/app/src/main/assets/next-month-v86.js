(() => {
  if (window.__maliNextMonthV86) return;
  window.__maliNextMonthV86 = true;

  const $ = (id) => document.getElementById(id);
  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const whole = (value) => Math.max(0, Math.round(Number(value) || 0));
  const makeId = () => `m86-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const riyal = (value) => `${new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(whole(value))} ر.س`;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c]));

  function monthKey(offset = 0) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  function monthName(key) {
    const [year, month] = String(key).split('-').map(Number);
    if (!year || !month) return key;
    return new Intl.DateTimeFormat('ar-SA', { month: 'long', year: 'numeric' })
      .format(new Date(year, month - 1, 1));
  }

  function monthIndex(key) {
    const [year, month] = String(key).split('-').map(Number);
    return year * 12 + (month - 1);
  }

  function monthDiff(start, target) {
    return monthIndex(target) - monthIndex(start);
  }

  function ensureStore() {
    state.settings = state.settings || {};
    if (!state.settings.monthPlannerV86 || typeof state.settings.monthPlannerV86 !== 'object') {
      state.settings.monthPlannerV86 = { version: 1, items: [] };
    }
    if (!Array.isArray(state.settings.monthPlannerV86.items)) {
      state.settings.monthPlannerV86.items = [];
    }
    return state.settings.monthPlannerV86;
  }

  function items() {
    return ensureStore().items;
  }

  function persist(message) {
    try {
      if (typeof save === 'function') save();
      else {
        localStorage.setItem('mali_finance_state', JSON.stringify(state));
        window.MaliAndroid?.persistFinanceData?.(JSON.stringify(state));
      }
    } catch (_) {}
    renderAll();
    if (message) {
      if (typeof toast === 'function') toast(message);
    }
  }

  function activeItem(item, month) {
    const diff = monthDiff(item.startMonth, month);
    if (diff < 0) return false;
    if (item.schedule === 'once') return diff === 0;
    if (item.schedule === 'installment') return diff < Math.max(1, whole(item.months || 1));
    return true;
  }

  function completedFor(item, month) {
    return Array.isArray(item.completedMonths) && item.completedMonths.includes(month);
  }

  function projectedItems(month, includeCompleted = true) {
    return items().filter((item) => activeItem(item, month) && (includeCompleted || !completedFor(item, month)));
  }

  function existingPlanActive(plan, month) {
    if (!plan) return false;
    if (plan.startMonth && String(plan.startMonth) > month) return false;
    if (plan.endMonth && String(plan.endMonth) < month) return false;
    if (plan.kind === 'installment' && plan.startMonth && whole(plan.months) > 0) {
      const diff = monthDiff(plan.startMonth, month);
      if (diff < 0 || diff >= whole(plan.months)) return false;
    }
    return true;
  }

  function existingPlanAmount(plan) {
    try {
      if (typeof planAmount === 'function') return whole(planAmount(plan));
    } catch (_) {}
    if (plan.kind === 'installment' && whole(plan.totalAmount) > 0 && whole(plan.months) > 0) {
      return Math.floor(whole(plan.totalAmount) / whole(plan.months));
    }
    return whole(plan.amount);
  }

  function existingPlansFor(month) {
    return (state.plans || []).filter((plan) => existingPlanActive(plan, month)).map((plan) => ({
      id: plan.id,
      title: plan.title || 'التزام',
      amount: existingPlanAmount(plan),
      dueDay: whole(plan.dueDay || 1),
      kind: plan.kind || 'monthly'
    }));
  }

  function injectStyles() {
    if ($('mali-next-month-v86-style')) return;
    const style = document.createElement('style');
    style.id = 'mali-next-month-v86-style';
    style.textContent = `
      .m86-month-switch{display:grid;grid-template-columns:1fr 1fr;gap:5px;background:var(--card2);border:1px solid var(--line);padding:4px;border-radius:15px;margin:-3px 0 14px}
      .m86-month-switch button{border:0;background:transparent;color:var(--muted);min-height:42px;border-radius:11px;font-size:.74rem;font-weight:900}
      .m86-month-switch button.active{background:var(--card);color:var(--accent);box-shadow:0 3px 10px rgba(31,45,73,.07)}
      .m86-next-panel{display:none}.m86-next-mode .m86-next-panel{display:block}
      .m86-next-mode [data-page="home"]>.hero,.m86-next-mode [data-page="home"]>.metrics,.m86-next-mode [data-page="home"]>.quick,.m86-next-mode [data-page="home"]>.two-col,.m86-next-mode [data-page="home"]>.hybrid-plan-card,.m86-next-mode [data-page="home"]>.m86-current-card{display:none!important}
      .m86-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:11px}
      .m86-summary>div{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:12px;min-width:0}
      .m86-summary span{display:block;color:var(--muted);font-size:.62rem}.m86-summary strong{display:block;margin-top:5px;font-size:.9rem;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .m86-summary .income strong{color:var(--income,#16805f)}.m86-summary .expense strong{color:var(--expense,#d55353)}.m86-summary .net strong{color:var(--plan,var(--accent))}
      .m86-card{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:15px;margin-bottom:11px}
      .m86-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px}.m86-card-head h3{margin:0;font-size:.95rem;font-weight:950}.m86-card-head p{margin:4px 0 0;color:var(--muted);font-size:.68rem;line-height:1.5}
      .m86-add{border:0;background:var(--accent);color:#fff;border-radius:12px;padding:9px 11px;font-size:.7rem;font-weight:900;white-space:nowrap}
      .m86-list{display:grid;gap:8px}.m86-item{background:var(--card2);border-radius:16px;padding:11px}.m86-item-top{display:grid;grid-template-columns:36px 1fr auto;gap:9px;align-items:center}.m86-icon{width:36px;height:36px;border-radius:12px;background:var(--card);display:grid;place-items:center;font-size:1rem}.m86-item-name{font-size:.8rem;font-weight:900}.m86-item-meta{font-size:.61rem;color:var(--muted);margin-top:3px;line-height:1.5}.m86-amount{font-size:.72rem;font-weight:950;white-space:nowrap}.m86-amount.income{color:var(--income,#16805f)}.m86-amount.expense{color:var(--expense,#d55353)}
      .m86-actions{display:flex;gap:6px;justify-content:flex-end;margin-top:9px;flex-wrap:wrap}.m86-actions button{border:0;border-radius:10px;padding:7px 9px;background:var(--card);color:var(--text);font-size:.63rem;font-weight:850}.m86-actions .danger{color:var(--danger)}.m86-actions .primary{background:var(--accent);color:#fff}.m86-actions .done{color:var(--income,#16805f)}
      .m86-empty{text-align:center;padding:18px 10px;background:var(--card2);border-radius:15px;color:var(--muted);font-size:.7rem;line-height:1.7}.m86-empty b{display:block;color:var(--text);font-size:.8rem}
      .m86-existing{border-top:1px dashed var(--line);margin-top:12px;padding-top:12px}.m86-existing-title{font-size:.68rem;color:var(--muted);font-weight:850;margin-bottom:7px}.m86-existing-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 9px;border-radius:12px;background:var(--card2);margin-bottom:6px;font-size:.68rem}.m86-existing-row b{font-size:.68rem;white-space:nowrap}
      .m86-current-card{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:15px;margin:0 0 11px}.m86-current-card.hidden{display:none!important}.m86-current-status{font-size:.62rem;color:var(--muted);margin-top:2px}.m86-item.completed{opacity:.58}.m86-item.completed .m86-item-name{text-decoration:line-through}
      .m86-modal{position:fixed;inset:0;z-index:280;background:rgba(12,18,30,.52);display:grid;align-items:end;padding:12px}.m86-modal.hidden{display:none!important}.m86-sheet{width:100%;max-width:640px;max-height:91vh;overflow:auto;margin:auto;background:var(--card);border:1px solid var(--line);border-radius:25px 25px 18px 18px;padding:17px;color:var(--text)}.m86-sheet-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:13px}.m86-sheet-head h3{margin:0;font-size:1rem}.m86-sheet-head p{margin:4px 0 0;color:var(--muted);font-size:.67rem}.m86-close{border:0;background:var(--card2);color:var(--text);width:38px;height:38px;border-radius:12px;font-size:1.2rem}
      .m86-type-note{background:var(--card2);border-radius:13px;padding:10px 11px;color:var(--muted);font-size:.66rem;line-height:1.7}
      .dark .m86-month-switch button.active{box-shadow:none}.dark .m86-add,.dark .m86-actions .primary{color:#fff}
      @media(max-width:520px){.m86-summary{grid-template-columns:1fr 1fr}.m86-summary .net{grid-column:1/3}.m86-card-head{align-items:center}.m86-item-top{grid-template-columns:34px 1fr auto}.m86-icon{width:34px;height:34px}}
    `;
    document.head.appendChild(style);
  }

  function ensureHomeUi() {
    const page = q('[data-page="home"]');
    const heading = q('.heading', page);
    if (!page || !heading) return false;

    if (!$('m86MonthSwitch')) {
      const switcher = document.createElement('div');
      switcher.id = 'm86MonthSwitch';
      switcher.className = 'm86-month-switch';
      switcher.innerHTML = `<button type="button" class="active" data-mode="current">هذا الشهر</button><button type="button" data-mode="next">الشهر القادم · ${esc(monthName(monthKey(1)))}</button>`;
      heading.insertAdjacentElement('afterend', switcher);
      qa('button', switcher).forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
    }

    if (!$('m86NextPanel')) {
      const panel = document.createElement('div');
      panel.id = 'm86NextPanel';
      panel.className = 'm86-next-panel';
      const switcher = $('m86MonthSwitch');
      switcher.insertAdjacentElement('afterend', panel);
    }

    if (!$('m86CurrentPlanned')) {
      const card = document.createElement('section');
      card.id = 'm86CurrentPlanned';
      card.className = 'm86-current-card hidden';
      const quick = q('.quick', page);
      if (quick?.nextSibling) quick.parentNode.insertBefore(card, quick.nextSibling);
      else page.appendChild(card);
    }

    ensureModal();
    return true;
  }

  function setMode(mode) {
    const next = mode === 'next';
    document.body.classList.toggle('m86-next-mode', next);
    qa('#m86MonthSwitch button').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
    if (next) renderNext();
    else renderCurrentPlanned();
  }

  function scheduleLabel(item) {
    if (item.schedule === 'monthly') return 'شهري من هذا الشهر وما بعده';
    if (item.schedule === 'installment') return `أقساط لمدة ${whole(item.months)} شهر`;
    return 'مرة واحدة فقط';
  }

  function renderNext() {
    const panel = $('m86NextPanel');
    if (!panel) return;
    const target = monthKey(1);
    const projected = projectedItems(target);
    const plans = existingPlansFor(target);
    const income = projected.filter((item) => item.kind === 'income').reduce((sum, item) => sum + whole(item.amount), 0);
    const plannedExpense = projected.filter((item) => item.kind === 'expense').reduce((sum, item) => sum + whole(item.amount), 0);
    const existingExpense = plans.reduce((sum, plan) => sum + whole(plan.amount), 0);
    const expense = plannedExpense + existingExpense;
    const net = income - expense;

    const itemRows = projected.length ? projected.map((item) => itemHtml(item, target, false)).join('') : `
      <div class="m86-empty"><b>ابدأ من هنا</b>أضف راتبك المتوقع ومستلزمات وفواتير ${esc(monthName(target))}، وحدد هل هي مرة واحدة أو شهرية أو أقساط.</div>`;

    const planRows = plans.length ? `<div class="m86-existing"><div class="m86-existing-title">التزاماتك الموجودة أصلًا وستدخل الشهر القادم تلقائيًا</div>${plans.map((plan) => `<div class="m86-existing-row"><span>${esc(plan.title)} · يوم ${plan.dueDay || 1}</span><b>${riyal(plan.amount)}</b></div>`).join('')}</div>` : '';

    panel.innerHTML = `
      <div class="m86-summary">
        <div class="income"><span>دخل متوقع</span><strong>${riyal(income)}</strong></div>
        <div class="expense"><span>مطلوب ومتوقع</span><strong>${riyal(expense)}</strong></div>
        <div class="net"><span>المتبقي المتوقع</span><strong>${net < 0 ? '−' : ''}${riyal(Math.abs(net))}</strong></div>
      </div>
      <section class="m86-card">
        <div class="m86-card-head"><div><h3>تجهيز ${esc(monthName(target))}</h3><p>خطط الآن بدون ما تتداخل الأرقام مع الشهر الحالي</p></div><button class="m86-add" type="button" onclick="openM86Planner()">＋ إضافة</button></div>
        <div class="m86-list">${itemRows}</div>
        ${planRows}
      </section>
      <section class="m86-card"><div class="m86-type-note"><b style="color:var(--text)">كيف تستخدمها؟</b><br>مرة واحدة: شيء خاص بالشهر القادم فقط. شهري: مثل الراتب أو الجوال ويستمر تلقائيًا كل شهر. أقساط: يتكرر للعدد الذي تحدده من الأشهر ثم يتوقف تلقائيًا.</div></section>`;
  }

  function itemHtml(item, month, current) {
    const completed = completedFor(item, month);
    const account = (state.accounts || []).find((x) => x.id === item.accountId);
    const category = (state.categories || []).find((x) => x.id === item.categoryId);
    const icon = item.kind === 'income' ? '↑' : item.schedule === 'installment' ? '▥' : '↓';
    const details = [scheduleLabel(item), `يوم ${whole(item.dueDay || 1)}`, account?.name, category?.name].filter(Boolean).join(' · ');
    const actions = current ? `
      <button type="button" class="primary" onclick="recordM86Item('${item.id}')">تسجيل عملية</button>
      <button type="button" class="done" onclick="toggleM86Done('${item.id}','${month}')">${completed ? 'إلغاء تم' : 'تم لهذا الشهر'}</button>` : `
      <button type="button" onclick="openM86Planner('${item.id}')">تعديل</button>
      <button type="button" class="danger" onclick="deleteM86Item('${item.id}')">حذف</button>`;

    return `<div class="m86-item ${completed ? 'completed' : ''}"><div class="m86-item-top"><span class="m86-icon">${icon}</span><div><div class="m86-item-name">${esc(item.title)}</div><div class="m86-item-meta">${esc(details)}</div></div><b class="m86-amount ${item.kind}">${item.kind === 'income' ? '+' : '−'} ${riyal(item.amount)}</b></div><div class="m86-actions">${actions}</div></div>`;
  }

  function renderCurrentPlanned() {
    const card = $('m86CurrentPlanned');
    if (!card) return;
    const current = monthKey(0);
    const active = projectedItems(current);
    if (!active.length) {
      card.classList.add('hidden');
      card.innerHTML = '';
      return;
    }
    const pending = active.filter((item) => !completedFor(item, current));
    card.classList.remove('hidden');
    card.innerHTML = `<div class="m86-card-head"><div><h3>خطة ${esc(monthName(current))}</h3><p>العناصر التي جهزتها سابقًا انتقلت تلقائيًا لهذا الشهر</p></div><span class="badge">${pending.length} متبقي</span></div><div class="m86-list">${active.map((item) => itemHtml(item, current, true)).join('')}</div>`;
  }

  function ensureModal() {
    if ($('m86PlannerModal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="m86PlannerModal" class="m86-modal hidden">
        <div class="m86-sheet">
          <div class="m86-sheet-head"><div><h3 id="m86ModalTitle">إضافة للشهر القادم</h3><p id="m86ModalSub"></p></div><button type="button" class="m86-close" onclick="closeM86Planner()">×</button></div>
          <form id="m86PlannerForm" class="form">
            <input id="m86EditId" type="hidden">
            <div class="two">
              <label class="label">النوع<select id="m86Kind" class="field"><option value="expense">مصروف / التزام</option><option value="income">دخل متوقع</option></select></label>
              <label class="label">المبلغ<input id="m86Amount" class="field" type="number" inputmode="numeric" min="1" step="1" required placeholder="0"></label>
            </div>
            <label class="label">الاسم<input id="m86Title" class="field" required placeholder="مثال راتب أو بنزين أو فاتورة"></label>
            <label class="label">التكرار<select id="m86Schedule" class="field"><option value="once">مرة واحدة في الشهر القادم</option><option value="monthly">شهري ابتداءً من الشهر القادم</option><option value="installment">أقساط تبدأ الشهر القادم</option></select></label>
            <div class="two">
              <label class="label">يوم الاستحقاق<input id="m86DueDay" class="field" type="number" min="1" max="28" value="1"></label>
              <label id="m86MonthsWrap" class="label hidden">عدد أشهر الأقساط<input id="m86Months" class="field" type="number" min="2" max="120" value="2"></label>
            </div>
            <div class="two">
              <label class="label">الحساب اختياري<select id="m86Account" class="field"></select></label>
              <label class="label">التصنيف اختياري<select id="m86Category" class="field"></select></label>
            </div>
            <label class="label">ملاحظة اختيارية<input id="m86Note" class="field" placeholder="أي تفاصيل تساعدك الشهر القادم"></label>
            <div id="m86FormNote" class="m86-type-note"></div>
            <button class="btn" type="submit">حفظ في خطة الشهر القادم</button>
            <button class="btn secondary" type="button" onclick="closeM86Planner()">إلغاء</button>
          </form>
        </div>
      </div>`);
    $('m86PlannerForm')?.addEventListener('submit', savePlannerItem);
    $('m86Schedule')?.addEventListener('change', updateFormNote);
    $('m86Kind')?.addEventListener('change', populateCategorySelect);
    $('m86PlannerModal')?.addEventListener('click', (event) => {
      if (event.target?.id === 'm86PlannerModal') closePlanner();
    });
  }

  function populateAccountSelect(selected = '') {
    const field = $('m86Account');
    if (!field) return;
    field.innerHTML = `<option value="">بدون تحديد</option>${(state.accounts || []).map((account) => `<option value="${esc(account.id)}">${esc(account.name || 'حساب')}</option>`).join('')}`;
    if (selected) field.value = selected;
  }

  function populateCategorySelect(selected = '') {
    const field = $('m86Category');
    if (!field) return;
    const kind = $('m86Kind')?.value || 'expense';
    let categories = state.categories || [];
    const matching = categories.filter((category) => !category.kind || category.kind === kind || category.type === kind);
    if (matching.length) categories = matching;
    field.innerHTML = `<option value="">بدون تحديد</option>${categories.map((category) => `<option value="${esc(category.id)}">${esc(category.name || 'تصنيف')}</option>`).join('')}`;
    if (selected) field.value = selected;
  }

  function updateFormNote() {
    const schedule = $('m86Schedule')?.value || 'once';
    $('m86MonthsWrap')?.classList.toggle('hidden', schedule !== 'installment');
    const target = monthName(monthKey(1));
    const note = schedule === 'monthly'
      ? `سيظهر أول مرة في ${target} ثم يستمر تلقائيًا في الشهور التالية.`
      : schedule === 'installment'
        ? `سيبدأ في ${target} ويستمر فقط لعدد الأشهر الذي تحدده.`
        : `سيظهر في ${target} فقط ولن يتكرر بعده.`;
    if ($('m86FormNote')) $('m86FormNote').textContent = note;
  }

  function openPlanner(itemId = '') {
    ensureModal();
    const item = itemId ? items().find((x) => x.id === itemId) : null;
    $('m86EditId').value = item?.id || '';
    $('m86Title').value = item?.title || '';
    $('m86Amount').value = item?.amount || '';
    $('m86Kind').value = item?.kind || 'expense';
    $('m86Schedule').value = item?.schedule || 'once';
    $('m86DueDay').value = item?.dueDay || 1;
    $('m86Months').value = item?.months || 2;
    $('m86Note').value = item?.note || '';
    populateAccountSelect(item?.accountId || '');
    populateCategorySelect(item?.categoryId || '');
    $('m86ModalTitle').textContent = item ? 'تعديل خطة الشهر القادم' : 'إضافة للشهر القادم';
    $('m86ModalSub').textContent = monthName(item?.startMonth || monthKey(1));
    updateFormNote();
    $('m86PlannerModal').classList.remove('hidden');
    setTimeout(() => $('m86Title')?.focus(), 30);
  }

  function closePlanner() {
    $('m86PlannerModal')?.classList.add('hidden');
  }

  function savePlannerItem(event) {
    event.preventDefault();
    const editId = $('m86EditId').value;
    const title = $('m86Title').value.trim();
    const amount = whole($('m86Amount').value);
    if (!title || amount <= 0) return;
    const schedule = $('m86Schedule').value;
    const existing = editId ? items().find((x) => x.id === editId) : null;
    const payload = {
      id: existing?.id || makeId(),
      title,
      amount,
      kind: $('m86Kind').value,
      schedule,
      dueDay: Math.max(1, Math.min(28, whole($('m86DueDay').value || 1))),
      months: schedule === 'installment' ? Math.max(2, whole($('m86Months').value || 2)) : 0,
      accountId: $('m86Account').value || '',
      categoryId: $('m86Category').value || '',
      note: $('m86Note').value.trim(),
      startMonth: existing?.startMonth || monthKey(1),
      completedMonths: Array.isArray(existing?.completedMonths) ? existing.completedMonths : [],
      createdAt: existing?.createdAt || new Date().toISOString()
    };
    if (existing) Object.assign(existing, payload);
    else items().push(payload);
    closePlanner();
    persist(existing ? 'تم تحديث خطة الشهر القادم' : 'تمت الإضافة لخطة الشهر القادم');
  }

  function deleteItem(itemId) {
    const store = ensureStore();
    const item = store.items.find((x) => x.id === itemId);
    if (!item) return;
    if (!confirm(`حذف ${item.title} من الخطة؟`)) return;
    store.items = store.items.filter((x) => x.id !== itemId);
    persist('تم الحذف من الخطة');
  }

  function toggleDone(itemId, month) {
    const item = items().find((x) => x.id === itemId);
    if (!item) return;
    if (!Array.isArray(item.completedMonths)) item.completedMonths = [];
    if (item.completedMonths.includes(month)) item.completedMonths = item.completedMonths.filter((x) => x !== month);
    else item.completedMonths.push(month);
    persist('تم تحديث حالة خطة الشهر');
  }

  function recordItem(itemId) {
    const item = items().find((x) => x.id === itemId);
    if (!item) return;
    if (typeof go === 'function') go('transactions');
    setTimeout(() => {
      q('#typeSeg [data-v="once"]')?.click();
      if ($('txKind')) {
        $('txKind').value = item.kind;
        $('txKind').dispatchEvent(new Event('change', { bubbles: true }));
      }
      if ($('txAmount')) $('txAmount').value = whole(item.amount);
      if ($('txTitle')) $('txTitle').value = item.title;
      if ($('txAccount') && item.accountId) $('txAccount').value = item.accountId;
      if ($('txCategory') && item.categoryId) $('txCategory').value = item.categoryId;
      if ($('txDate')) $('txDate').value = new Date().toISOString().slice(0, 10);
      if ($('txNote') && item.note) $('txNote').value = item.note;
      try { $('txAmount')?.focus({ preventScroll: true }); } catch (_) { $('txAmount')?.focus(); }
      if (typeof toast === 'function') toast('راجِع العملية ثم اضغط حفظ');
    }, 80);
  }

  function renderAll() {
    if (!ensureHomeUi()) return;
    renderNext();
    renderCurrentPlanned();
  }

  window.openM86Planner = openPlanner;
  window.closeM86Planner = closePlanner;
  window.deleteM86Item = deleteItem;
  window.toggleM86Done = toggleDone;
  window.recordM86Item = recordItem;

  function boot() {
    try {
      ensureStore();
      injectStyles();
      renderAll();
      setTimeout(renderAll, 250);
      setTimeout(renderAll, 900);
    } catch (error) {
      console.warn('Mali next-month planner failed to initialize', error);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();