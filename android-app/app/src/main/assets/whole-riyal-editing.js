(() => {
  if (window.__maliWholeRiyalEditing) return;
  window.__maliWholeRiyalEditing = true;
  const whole = (value) => Math.round(Number(value) || 0);

  window.editTx = function (transactionId) {
    const transaction = state.transactions.find((x) => x.id === transactionId);
    if (!transaction) return;
    const title = prompt('اسم العملية', transaction.title);
    if (!title) return;
    const rawAmount = prompt('المبلغ بالريال الكامل', String(whole(transaction.amount)));
    if (rawAmount == null) return;
    const amount = whole(rawAmount);
    const date = prompt('التاريخ YYYY-MM-DD', transaction.date);
    transaction.title = title.trim();
    if (amount > 0) transaction.amount = amount;
    if (/^\d{4}-\d{2}-\d{2}$/.test(date || '')) transaction.date = date;
    save(); toast('تم تعديل العملية');
  };

  window.editPlan = function (planId) {
    const plan = state.plans.find((x) => x.id === planId);
    if (!plan) return;
    const title = prompt('اسم الالتزام', plan.title);
    if (!title) return;
    plan.title = title.trim();
    if (plan.kind === 'monthly') {
      const rawAmount = prompt('المبلغ الشهري بالريال الكامل', String(whole(plan.amount)));
      if (rawAmount != null) {
        const amount = whole(rawAmount);
        if (amount > 0) plan.amount = amount;
      }
    } else {
      const rawTotal = prompt('الإجمالي بالريال الكامل', String(whole(plan.totalAmount)));
      const rawMonths = prompt('عدد الأشهر', String(whole(plan.months)));
      if (rawTotal != null) {
        const total = whole(rawTotal);
        if (total > 0) plan.totalAmount = total;
      }
      if (rawMonths != null) {
        const months = whole(rawMonths);
        if (months > 0) plan.months = months;
      }
      plan.amount = Math.floor(whole(plan.totalAmount) / Math.max(1, whole(plan.months)));
    }
    save(); toast('تم تعديل الالتزام');
  };

  window.updateGoal = function (goalId) {
    const goal = (state.goals || []).find((x) => x.id === goalId);
    if (!goal) return;
    const raw = prompt('المبلغ المحقق حاليًا بالريال الكامل', String(whole(goal.saved)));
    if (raw == null) return;
    goal.saved = Math.max(0, whole(raw));
    save(); toast('تم تحديث الهدف');
  };

  window.payDebt = function (debtId) {
    const debt = (state.debts || []).find((x) => x.id === debtId);
    if (!debt || whole(debt.remaining) <= 0) return;
    const raw = prompt('قيمة الدفعة بالريال الكامل', String(Math.min(whole(debt.remaining), 100)));
    if (raw == null) return;
    const value = whole(raw);
    if (value <= 0) return;
    debt.remaining = Math.max(0, whole(debt.remaining) - value);
    save(); toast('تم تحديث المتبقي');
  };
})();
