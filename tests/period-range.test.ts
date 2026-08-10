import { describe, expect, it } from "vitest";
import { monthsInRange, periodRange, shiftPeriodAnchor } from "../src/lib/demo-store";

describe("financial period ranges", () => {
  it("calculates daily, weekly and biweekly ranges inclusively", () => {
    expect(periodRange("day", "2026-08-10")).toMatchObject({ start: "2026-08-10", end: "2026-08-10", days: 1 });
    expect(periodRange("week", "2026-08-10")).toMatchObject({ start: "2026-08-04", end: "2026-08-10", days: 7 });
    expect(periodRange("twoWeeks", "2026-08-10")).toMatchObject({ start: "2026-07-28", end: "2026-08-10", days: 14 });
  });

  it("uses complete calendar months for multi-month calculations", () => {
    const range = periodRange("quarter", "2026-08-10");
    expect(range).toMatchObject({ start: "2026-06-01", end: "2026-08-31", days: 92 });
    expect(monthsInRange(range)).toEqual(["2026-06", "2026-07", "2026-08"]);
  });

  it("moves the anchor by the selected period", () => {
    expect(shiftPeriodAnchor("2026-08-10", "twoWeeks", -1)).toBe("2026-07-27");
    expect(shiftPeriodAnchor("2026-08-10", "twoMonths", 1)).toBe("2026-10-10");
  });
});
