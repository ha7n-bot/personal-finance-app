import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { accountDelta, spendingTotal } from "../src/lib/financial/ledger";
const decimal = (value: number) => new Prisma.Decimal(value);
describe("financial ledger", () => {
  it("does not count transfers as spending", () => expect(spendingTotal([{ type: "TRANSFER", amount: decimal(2000) }, { type: "EXPENSE", amount: decimal(120) }]).toString()).toBe("120"));
  it("applies transfers to both accounts", () => { const rows = [{ type: "TRANSFER" as const, amount: decimal(2000), sourceAccountId: "a", destinationAccountId: "b" }]; expect(accountDelta("a", rows).toString()).toBe("-2000"); expect(accountDelta("b", rows).toString()).toBe("2000"); });
});
