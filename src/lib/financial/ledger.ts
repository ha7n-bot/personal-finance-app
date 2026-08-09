import { Prisma, TransactionType } from "@prisma/client";
type Entry = { type: TransactionType; amount: Prisma.Decimal; sourceAccountId: string | null; destinationAccountId: string | null };
export function accountDelta(accountId: string, entries: Entry[]) {
  return entries.reduce((total, entry) => {
    if (entry.type === "INCOME" && entry.destinationAccountId === accountId) return total.plus(entry.amount);
    if (["EXPENSE", "INVESTMENT", "DEBT_PAYMENT", "SAVING"].includes(entry.type) && entry.sourceAccountId === accountId) return total.minus(entry.amount);
    if (entry.type === "TRANSFER") {
      if (entry.sourceAccountId === accountId) return total.minus(entry.amount);
      if (entry.destinationAccountId === accountId) return total.plus(entry.amount);
    }
    return total;
  }, new Prisma.Decimal(0));
}
export function spendingTotal(entries: Pick<Entry, "type" | "amount">[]) {
  return entries.filter((e) => e.type === "EXPENSE").reduce((sum, e) => sum.plus(e.amount), new Prisma.Decimal(0));
}
