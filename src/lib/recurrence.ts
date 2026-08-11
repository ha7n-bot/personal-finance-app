function occurrenceInMonth(value: Date, year: number, month: number, requestedDay: number) {
  const date = new Date(Date.UTC(year, month, 1, value.getUTCHours(), value.getUTCMinutes(), value.getUTCSeconds(), value.getUTCMilliseconds()));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(requestedDay, lastDay));
  return date;
}

export function nextMonthlyDate(value: Date) {
  return occurrenceInMonth(value, value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
}

export function nextRecurringDate(value: Date, frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM") {
  if (frequency === "WEEKLY") {
    const next = new Date(value);
    next.setUTCDate(next.getUTCDate() + 7);
    return next;
  }
  if (frequency === "QUARTERLY") return occurrenceInMonth(value, value.getUTCFullYear(), value.getUTCMonth() + 3, value.getUTCDate());
  if (frequency === "YEARLY") return occurrenceInMonth(value, value.getUTCFullYear() + 1, value.getUTCMonth(), value.getUTCDate());
  return nextMonthlyDate(value);
}

export function nextMonthlyOccurrence(value: Date, after = new Date()) {
  const requestedDay = value.getUTCDate();
  let offset = 1;
  let next = occurrenceInMonth(value, value.getUTCFullYear(), value.getUTCMonth() + offset, requestedDay);
  while (next <= after) {
    offset += 1;
    next = occurrenceInMonth(value, value.getUTCFullYear(), value.getUTCMonth() + offset, requestedDay);
  }
  return next;
}

export function nextDueDay(day: number, from = new Date()) {
  const safeDay = Math.max(1, Math.min(31, Math.trunc(day)));
  let year = from.getUTCFullYear();
  let month = from.getUTCMonth();
  const create = () => {
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return new Date(Date.UTC(year, month, Math.min(safeDay, lastDay), 12));
  };
  let due = create();
  if (due <= from) {
    month += 1;
    if (month > 11) { month = 0; year += 1; }
    due = create();
  }
  return due;
}
