import { describe, expect, it } from "vitest";
import { installmentRemaining, nextInstallmentAmount, regularInstallmentAmount } from "../src/lib/installments";

describe("fixed installment plans", () => {
  it("keeps two-decimal regular installments", () => {
    expect(regularInstallmentAmount("1000", 3).toString()).toBe("333.33");
  });

  it("puts the rounding difference in the final installment", () => {
    expect(nextInstallmentAmount("1000", 3, 0).toString()).toBe("333.33");
    expect(nextInstallmentAmount("1000", 3, 1).toString()).toBe("333.33");
    expect(nextInstallmentAmount("1000", 3, 2).toString()).toBe("333.34");
  });

  it("tracks the remaining amount and closes the plan", () => {
    expect(installmentRemaining("1000", 3, 1).toString()).toBe("666.67");
    expect(installmentRemaining("1000", 3, 3).toString()).toBe("0");
    expect(nextInstallmentAmount("1000", 3, 3).toString()).toBe("0");
  });

  it("refuses a plan that would create a zero-value installment", () => {
    expect(() => regularInstallmentAmount("0.01", 2)).toThrow();
  });
});
