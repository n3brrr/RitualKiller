import { describe, expect, it } from "vitest";
import { daysUntil, isSameWeek, lastNDays, toDateKey } from "./dates";

describe("date helpers", () => {
  it("builds local date keys without UTC shifts", () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
    expect(toDateKey(new Date(2026, 11, 31, 0, 5))).toBe("2026-12-31");
  });

  it("returns the last N local days in order", () => {
    expect(lastNDays(3, new Date(2026, 0, 5))).toEqual([
      "2026-01-03",
      "2026-01-04",
      "2026-01-05",
    ]);
    expect(lastNDays(0)).toEqual([]);
  });

  it("counts days until a target date", () => {
    expect(daysUntil("2026-01-10", new Date(2026, 0, 5))).toBe(5);
    expect(daysUntil("2026-01-05", new Date(2026, 0, 5))).toBe(0);
  });

  it("compares ISO weeks starting on Monday", () => {
    expect(isSameWeek("2026-11-09", "2026-11-15")).toBe(true);
    expect(isSameWeek("2026-11-08", "2026-11-09")).toBe(false);
    expect(isSameWeek("2026-11-13", "2026-11-09")).toBe(true);
  });
});
