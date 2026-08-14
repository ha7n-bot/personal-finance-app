(() => {
  if (window.__maliHybridV85) return;
  window.__maliHybridV85 = true;

  const $ = (id) => document.getElementById(id);
  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const whole = (value) => Math.round(Number(value) || 0);
  const riyal = (value) => `${new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(whole(value))} ر.س`;
  const currentMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));

  function injectStyles() {
    if ($('mali-hybrid-v85-style')) return;
    const style = document.createElement('style');
    style.id = 'mali-hybrid-v85-style';
    style.textContent = `
      :root{
        --bg:#f6f7fb;--card:#ffffff;--card2:#f1f3f7;--text:#172033;--muted:#768096;--line:#e5e8ef;
        --accent:#496ddb;--accent2:#3857bd;--danger:#d55353;--warn:#e39a24;--info:#5f7ce2;
        --income:#16805f;--expense:#d55353;--plan:#496ddb;--shadow:0 8px 26px rgba(31,45,73,.07)
      }
      html{background:var(--bg)}body{background:var(--bg);color:var(--text)}
      .app{max-width:840px}
      .top{background:rgba(246,247,251,.93)!important;border-bottom:1px solid rgba(229,232,239,.8)!important;backdrop-filter:blur(20px);padding:calc(10px + env(safe-area-inset-top)) 16px 10px!important}
      .brand{min-height:48px}.brand-main{gap:11px!important}.logo{width:42px!important;height:42px!important;border-radius:14px!important;background:linear-gradient(145deg,#1c2b48,#496ddb)!important;box-shadow:0 8px 18px rgba(73,109,219,.22)!important;font-size:20px!important}
      .brand h1{font-size:1.12rem!important;font-weight:900!important;letter-spacing:-.02em}.brand small{font-size:.72rem!important;color:var(--muted)!important}.save-state{font-size:.68rem!important;background:var(--card)!important;border:1px solid var(--line)!important;padding:6px 9px!important;border-radius:99px!important;color:var(--income)!important}
      .main{padding:14px 14px 22px!important}.heading{margin:3px 0 14px!important}.heading .eyebrow{font-size:.67rem!important;color:var(--accent)!important;letter-spacing:.02em}.heading h2{font-size:1.42rem!important;font-weight:950!important;margin:3px 0 3px!important}.heading p{font-size:.78rem!important;line-height:1.55!important}

      [data-page="home"]>.heading{padding:2px 2px 0}.hybrid-home-title{font-size:1.56rem!important}.hybrid-home-copy{max-width:520px}
      .hero{position:relative;overflow:hidden;background:linear-gradient(145deg,#17233b 0%,#243b74 58%,#496ddb 100%)!important;border-radius:26px!important;padding:21px!important;box-shadow:0 14px 32px rgba(36,59,116,.2)!important;margin-bottom:12px!important}
      .hero:after{content:'﷼';position:absolute;left:17px;top:3px;font-size:5.2rem;font-weight:900;opacity:.055;transform:rotate(-8deg)}
      .hero small{font-size:.76rem!important;opacity:.78!important}.hero strong{font-size:2.08rem!important;font-weight:950!important;letter-spacing:-.035em;margin:7px 0 4px!important}.hero p{font-size:.75rem!important;opacity:.75!important}
      .metrics{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important;margin-bottom:12px!important}.metric{border-radius:18px!important;padding:12px!important;border-color:var(--line)!important;box-shadow:none!important;min-width:0}.metric span{font-size:.64rem!important;line-height:1.4!important}.metric strong{font-size:.98rem!important;font-weight:900!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.metric:nth-child(1) strong{color:var(--income)!important}.metric:nth-child(2) strong{color:var(--expense)!important}.metric:nth-child(3) strong{color:var(--plan)!important}.metric:nth-child(4) strong{color:var(--warn)!important}

      .quick{grid-template-columns:repeat(3,1fr)!important;gap:9px!important;margin-bottom:14px!important}.quick button{position:relative;border:1px solid var(--line)!important;background:var(--card)!important;border-radius:18px!important;padding:13px 7px!important;box-shadow:none!important;font-size:.74rem!important;min-height:80px;color:var(--text)!important;transition:transform .14s ease,border-color .14s ease}.quick button:active{transform:scale(.975)}.quick b{width:37px;height:37px;margin:0 auto 7px!important;border-radius:12px;display:grid!important;place-items:center;font-size:1.05rem!important}.quick button:nth-child(1) b{background:#fceeee;color:var(--expense)}.quick button:nth-child(2) b{background:#eaf6f1;color:var(--income)}.quick button:nth-child(3) b{background:#edf0fb;color:var(--plan)}

      .card,.metric{background:var(--card)!important;border-color:var(--line)!important}.card{border-radius:22px!important;box-shadow:none!important;padding:15px!important;margin-bottom:11px!important}.card-head{margin-bottom:12px!important}.card-head h3{font-size:.94rem!important;font-weight:900!important}.card-head p{font-size:.69rem!important;line-height:1.45!important}.badge{background:#eef1fb!important;color:var(--plan)!important;padding:5px 8px!important}
      .row{background:var(--card2)!important;border-radius:16px!important;padding:11px!important}.row-icon{border-radius:13px!important;background:var(--card)!important}.row strong{font-size:.82rem!important}.row small{font-size:.65rem!important}.mini{border-radius:11px!important}.mini.primary{background:var(--accent)!important}.btn{border-radius:14px!important;background:var(--accent)!important;min-height:48px!important}.btn.secondary{background:var(--card2)!important;color:var(--text)!important}.field{border-radius:14px!important;background:var(--card)!important;min-height:48px!important}.field:focus{border-color:var(--accent)!important;box-shadow:0 0 0 3px rgba(73,109,219,.11)!important}.seg{border-radius:15px!important}.seg button.active{color:var(--accent)!important}.progress i{background:var(--accent)!important}

      .hybrid-plan-card{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:15px;margin:0 0 12px;box-shadow:none}.hybrid-plan-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px}.hybrid-plan-head h3{margin:0;font-size:.94rem;font-weight:900}.hybrid-plan-head p{margin:4px 0 0;color:var(--muted);font-size:.68rem;line-height:1.5}.hybrid-plan-open{border:0;background:#eef1fb;color:var(--plan);padding:7px 10px;border-radius:11px;font-size:.66rem;font-weight:850;white-space:nowrap}.hybrid-plan-list{display:grid;gap:8px}.hybrid-plan-row{padding:11px;border-radius:16px;background:var(--card2)}.hybrid-plan-top{display:grid;grid-template-columns:34px 1fr auto;gap:9px;align-items:center}.hybrid-plan-icon{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:var(--card);font-size:.95rem}.hybrid-plan-name{font-size:.78rem;font-weight:850}.hybrid-plan-meta{font-size:.61rem;color:var(--muted);margin-top:2px}.hybrid-plan-value{font-size:.68rem;font-weight:850;color:var(--plan);white-space:nowrap}.hybrid-plan-progress{height:7px;background:var(--line);border-radius:99px;overflow:hidden;margin-top:9px}.hybrid-plan-progress i{display:block;height:100%;border-radius:inherit;background:var(--plan)}.hybrid-plan-progress i.warn{background:var(--warn)}.hybrid-plan-progress i.done{background:var(--income)}.hybrid-plan-empty{padding:14px;text-align:center;color:var(--muted);font-size:.72rem;background:var(--card2);border-radius:15px}.hybrid-plan-empty b{display:block;color:var(--text);margin-bottom:3px}

      .nav{background:rgba(255,255,255,.96)!important;border-top:1px solid rgba(229,232,239,.88)!important;padding:6px 7px calc(7px + env(safe-area-inset-bottom))!important;box-shadow:0 -8px 28px rgba(31,45,73,.06)!important;backdrop-filter:blur(18px)}.nav button{border-radius:14px!important;padding:7px 2px!important;font-size:.61rem!important;min-height:52px}.nav b{font-size:1.08rem!important;margin-bottom:2px!important}.nav button.active{color:var(--accent)!important;background:#edf0fb!important}
      .chart{border-radius:18px;background:linear-gradient(180deg,rgba(73,109,219,.035),transparent);padding:14px 10px 0!important}.bar i{background:var(--income)!important}.bar b{background:var(--expense)!important}

      .dark{--bg:#0e1117;--card:#171b23;--card2:#202630;--text:#f2f4f8;--muted:#98a2b5;--line:#2a313d;--accent:#7893ef;--accent2:#6682e6;--income:#4eb995;--expense:#ef7777;--warn:#f1b34d;--plan:#7893ef;--shadow:none;color-scheme:dark}.dark .top{background:rgba(14,17,23,.94)!important;border-color:var(--line)!important}.dark .nav{background:rgba(14,17,23,.97)!important;border-color:var(--line)!important}.dark .nav button.active{background:#202a45!important}.dark .save-state{background:#171b23!important}.dark .quick button{background:var(--card)!important}.dark .quick button:nth-child(1) b{background:#382427}.dark .quick button:nth-child(2) b{background:#1c342c}.dark .quick button:nth-child(3) b{background:#222b49}.dark .badge,.dark .hybrid-plan-open{background:#222b49!important}.dark .hero{background:linear-gradient(145deg,#172033 0%,#24345d 55%,#4d6fcf 100%)!important}.dark .field{background:#171b23!important}.dark .mini{background:#242a34!important}

      @media(max-width:560px){
        .metrics{grid-template-columns:repeat(2,1fr)!important}.metric{min-height:76px}.main{padding-left:12px!important;padding-right:12px!important}.hero{padding:19px!important}.hero strong{font-size:1.85rem!important}.card{padding:14px!important}.two-col{display:block!important}.hybrid-plan-top{grid-template-columns:32px 1fr auto}.save-state span{display:none}.save-state{width:30px;height:30px;padding:0!important;justify-content:center}.save-state i{width:8px!important;height:8px!important}
      }
      @media(min-width:700px){.main{padding:20px 22px 28px!important}.hero{padding:24px!important}.nav{max-width:840px!important}.two-col{grid-template-columns:1.08fr .92fr!important}}
    `;
    document.head.appendChild(style);
  }

  function prepareHomeCopy() {
    const page = q('[data-page="home"]');
    if (!page) return;
    const heading = q('.heading', page);
    if (heading) {
      const eyebrow = q('.eyebrow', heading);
      const title = q('h2', heading);
      const copy = q('p', heading);
      if (eyebrow) eyebrow.textContent = 'ملخصك المالي';
      if (title) { title.textContent = 'صورة واضحة لأموالك'; title.classList.add('hybrid-home-title'); }
      if (copy) { copy.textContent = 'الرصيد والدخل والصرف والالتزامات المهمة أمامك بدون تعقيد'; copy.classList.add('hybrid-home-copy'); }
    }
    const hero = q('.hero', page);
    if (hero) {
      const small = q('small', hero);
      if (small) small.textContent = 'إجمالي ما تملكه الآن';
      const hint = q('p', hero);
      if (hint && !hint.dataset.hybridOriginal) hint.dataset.hybridOriginal = hint.textContent || '';
    }
    const quick = q('.quick', page);
    if (quick) {
      const buttons = qa('button', quick);
      if (buttons[0]) { buttons[0].innerHTML = '<b>↓</b>مصروف'; buttons[0].onclick = () => quickTransaction('expense'); }
      if (buttons[1]) { buttons[1].innerHTML = '<b>↑</b>دخل'; buttons[1].onclick = () => quickTransaction('income'); }
      if (buttons[2]) { buttons[2].innerHTML = '<b>▣</b>حساب'; }
    }
    ensurePlanOverview(page, quick);
  }

  function quickTransaction(kind) {
    if (typeof go === 'function') go('transactions');
    setTimeout(() => {
      const onceButton = q('#typeSeg [data-v="once"]');
      if (onceButton) onceButton.click();
      const kindField = $('txKind');
      if (kindField) {
        kindField.value = kind;
        kindField.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const amount = $('txAmount');
      if (amount) {
        try { amount.focus({ preventScroll: true }); } catch (_) { amount.focus(); }
      }
    }, 50);
  }
  window.maliHybridQuickTransaction = quickTransaction;

  function ensurePlanOverview(page, quick) {
    let card = $('hybridPlanOverview');
    if (!card) {
      card = document.createElement('section');
      card.id = 'hybridPlanOverview';
      card.className = 'hybrid-plan-card';
      card.innerHTML = `<div class="hybrid-plan-head"><div><h3>هذا الشهر</h3><p>أهم الالتزامات وما دفعته والمتبقي عليك</p></div><button class="hybrid-plan-open" type="button">فتح الالتزامات</button></div><div class="hybrid-plan-list" id="hybridPlanList"></div>`;
      q('.hybrid-plan-open', card)?.addEventListener('click', () => typeof go === 'function' && go('plans'));
      if (quick?.nextSibling) quick.parentNode.insertBefore(card, quick.nextSibling);
      else page.appendChild(card);
    }
    renderPlanOverview();
  }

  function activePlan(plan, month) {
    if (!plan) return false;
    if (plan.startMonth && String(plan.startMonth) > month) return false;
    if (plan.endMonth && String(plan.endMonth) < month) return false;
    return true;
  }

  function installmentAmount(plan) {
    if (typeof planAmount === 'function') {
      try { return whole(planAmount(plan)); } catch (_) {}
    }
    if (plan.amount) return whole(plan.amount);
    const total = whole(plan.totalAmount);
    const months = Math.max(1, whole(plan.months));
    return Math.floor(total / months);
  }

  function planProgress(plan, month) {
    if (plan.kind === 'monthly') {
      const target = Math.max(0, whole(plan.amount));
      const payments = Array.isArray(state?.planPayments) ? state.planPayments : [];
      let paid = payments
        .filter((payment) => payment.planId === plan.id && payment.month === month)
        .reduce((sum, payment) => sum + whole(payment.amount), 0);
      if (!payments.length && Array.isArray(plan.paidMonths) && plan.paidMonths.includes(month)) paid = target;
      return { target, paid, remaining: Math.max(0, target - paid) };
    }
    const target = installmentAmount(plan);
    const paid = Array.isArray(plan.paidMonths) && plan.paidMonths.includes(month) ? target : 0;
    return { target, paid, remaining: Math.max(0, target - paid) };
  }

  function categoryFor(plan) {
    if (typeof catBy === 'function') {
      try { return catBy(plan.categoryId) || {}; } catch (_) {}
    }
    return {};
  }

  function renderPlanOverview() {
    const list = $('hybridPlanList');
    if (!list || typeof state === 'undefined') return;
    const month = currentMonth();
    const plans = (state.plans || []).filter((plan) => activePlan(plan, month));
    if (!plans.length) {
      list.innerHTML = `<div class="hybrid-plan-empty"><b>لا توجد التزامات لهذا الشهر</b>أضف التزاماتك فقط عندما تحتاج متابعتها</div>`;
      return;
    }

    const rows = plans.map((plan) => {
      const progress = planProgress(plan, month);
      const ratio = progress.target > 0 ? progress.paid / progress.target : 0;
      const priority = progress.remaining > 0 ? progress.remaining : -progress.paid;
      return { plan, progress, ratio, priority };
    }).sort((a, b) => b.priority - a.priority).slice(0, 3);

    list.innerHTML = rows.map(({ plan, progress, ratio }) => {
      const category = categoryFor(plan);
      const pct = Math.max(0, Math.min(100, ratio * 100));
      const cls = ratio >= 1 ? 'done' : ratio >= .8 ? 'warn' : '';
      const value = progress.remaining > 0 ? `باقي ${riyal(progress.remaining)}` : 'مكتمل';
      const meta = progress.paid > 0 ? `${riyal(progress.paid)} من ${riyal(progress.target)}` : `المطلوب ${riyal(progress.target)}`;
      return `<div class="hybrid-plan-row"><div class="hybrid-plan-top"><span class="hybrid-plan-icon">${escapeHtml(category.icon || (plan.kind === 'installment' ? '🧾' : '📅'))}</span><div><div class="hybrid-plan-name">${escapeHtml(plan.title || 'التزام')}</div><div class="hybrid-plan-meta">${meta}</div></div><div class="hybrid-plan-value">${value}</div></div><div class="hybrid-plan-progress"><i class="${cls}" style="width:${pct}%"></i></div></div>`;
    }).join('');
  }

  function modernizeNav() {
    const nav = q('.nav');
    if (!nav) return;
    const labels = {
      home: ['⌂', 'الرئيسية'],
      transactions: ['↕', 'العمليات'],
      work: ['▣', 'العمل'],
      plans: ['◴', 'الالتزامات'],
      more: ['•••', 'المزيد']
    };
    qa('button', nav).forEach((button) => {
      const page = button.getAttribute('data-page') || button.dataset?.go || button.getAttribute('onclick')?.match(/go\(['"]([^'"]+)/)?.[1];
      if (!page || !labels[page] || button.dataset.hybridNav === '1') return;
      button.dataset.hybridNav = '1';
      const [icon, text] = labels[page];
      button.innerHTML = `<b>${icon}</b>${text}`;
    });
  }

  function decoratePageHeadings() {
    const copy = {
      transactions: ['الحركات المالية', 'العمليات', 'سجّل الدخل والمصروف والأقساط بطريقة مباشرة'],
      work: ['إيرادات المشاريع', 'العمل', 'تابع المشاريع ونسب الشركاء وما لك وما عليك'],
      plans: ['التزاماتك', 'الالتزامات', 'دفعات جزئية وفواتير وأقساط شهرية في مكان واحد'],
      more: ['كل الأدوات', 'المزيد', 'التقارير والأهداف والديون والإعدادات والنسخ الاحتياطي']
    };
    Object.entries(copy).forEach(([pageName, values]) => {
      const page = q(`[data-page="${pageName}"]`);
      const heading = page && q('.heading', page);
      if (!heading) return;
      const eyebrow = q('.eyebrow', heading), title = q('h2', heading), p = q('p', heading);
      if (eyebrow) eyebrow.textContent = values[0];
      if (title) title.textContent = values[1];
      if (p) p.textContent = values[2];
    });
  }

  function installObservers() {
    const home = q('[data-page="home"]');
    if (home && !window.__maliHybridObserver) {
      const observer = new MutationObserver(() => {
        clearTimeout(window.__maliHybridRenderTimer);
        window.__maliHybridRenderTimer = setTimeout(renderPlanOverview, 35);
      });
      ['balance', 'monthIncome', 'monthExpense', 'monthDue'].forEach((id) => {
        const node = $(id);
        if (node) observer.observe(node, { childList: true, characterData: true, subtree: true });
      });
      window.__maliHybridObserver = observer;
    }
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) setTimeout(renderPlanOverview, 60);
    });
    window.addEventListener('focus', () => setTimeout(renderPlanOverview, 60));
  }

  function init() {
    injectStyles();
    prepareHomeCopy();
    modernizeNav();
    decoratePageHeadings();
    installObservers();
    setTimeout(renderPlanOverview, 250);
    setTimeout(renderPlanOverview, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
