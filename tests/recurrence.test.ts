import { describe, expect, it } from "vitest";
import { nextDueDay, nextMonthlyDate, nextMonthlyOccurrence, nextRecurringDate } from "../src/lib/recurrence";

describe("recurring dates", () => {
  it("keeps the same day when possible", () => {
    expect(nextMonthlyDate(new Date("2026-08-10T12:00:00.000Z")).toISOString()).toBe("2026-09-10T12:00:00.000Z");
  });
  it("clamps to the final valid day", () => {
    expect(nextMonthlyDate(new Date("2026-01-31T12:00:00.000Z")).toISOString()).toBe("2026-02-28T12:00:00.000Z");
    expect(nextMonthlyDate(new Date("2024-01-31T12:00:00.000Z")).toISOString()).toBe("2024-02-29T12:00:00.000Z");
  });
  it("moves passed due dates forward", () => {
    expect(nextDueDay(5, new Date("2026-08-10T12:00:00.000Z")).toISOString()).toBe("2026-09-05T12:00:00.000Z");
    expect(nextMonthlyOccurrence(new Date("2026-01-31T12:00:00.000Z"), new Date("2026-08-10T12:00:00.000Z")).toISOString()).toBe("2026-08-31T12:00:00.000Z");
  });
  it("preserves weekly and quarterly schedules", () => {
    expect(nextRecurringDate(new Date("2026-08-11T12:00:00.000Z"), "WEEKLY").toISOString()).toBe("2026-08-18T12:00:00.000Z");
    expect(nextRecurringDate(new Date("2026-01-31T12:00:00.000Z"), "QUARTERLY").toISOString()).toBe("2026-04-30T12:00:00.000Z");
  });
});
