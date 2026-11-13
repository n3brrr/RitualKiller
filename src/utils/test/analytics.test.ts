import { describe, expect, it } from "vitest";
import type { Ritual, RitualLog } from "@/types";
import {
  buildDailySeries,
  buildDifficultySeries,
  calculateCompletionRate,
  filterLogsByDays,
  isRitualCompleted,
} from "../analytics";

const NOW = new Date(2026, 10, 13);

function ritual(overrides: Partial<Ritual> = {}): Ritual {
  return {
    id: "r1",
    user_id: "u1",
    title: "Test",
    description: "",
    difficulty: "novice",
    frequency: "daily",
    streak: 0,
    essenceReward: 10,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function log(overrides: Partial<RitualLog> = {}): RitualLog {
  return {
    id: "l1",
    ritualId: "r1",
    user_id: "u1",
    date: "2026-11-13",
    essence_gained: 10,
    ...overrides,
  };
}

describe("analytics helpers", () => {
  it("filters logs by local day range", () => {
    const logs = [
      log({ id: "l1", date: "2026-11-13" }),
      log({ id: "l2", date: "2026-11-10" }),
      log({ id: "l3", date: "2026-10-01" }),
    ];
    expect(filterLogsByDays(logs, 4, NOW).map((item) => item.id)).toEqual([
      "l1",
      "l2",
    ]);
  });

  it("builds a dense daily series", () => {
    const series = buildDailySeries(
      [log({ date: "2026-11-13" }), log({ id: "l2", date: "2026-11-13" })],
      2,
      NOW,
      "es",
    );
    expect(series).toHaveLength(2);
    expect(series[1]?.date).toBe("2026-11-13");
    expect(series[1]?.Completions).toBe(2);
    expect(series[0]?.Completions).toBe(0);
  });

  it("groups completions by difficulty", () => {
    const rituals = [
      ritual({ id: "r1", difficulty: "novice" }),
      ritual({ id: "r2", difficulty: "master" }),
    ];
    const series = buildDifficultySeries(rituals, [
      log({ id: "l1", ritualId: "r1" }),
      log({ id: "l2", ritualId: "r2" }),
      log({ id: "l3", ritualId: "r2" }),
    ]);
    expect(series).toEqual([
      { name: "Novice", Completions: 1 },
      { name: "Master", Completions: 2 },
    ]);
  });

  it("calculates a capped completion rate and guards empty input", () => {
    const rituals = [ritual(), ritual({ id: "r2" })];
    const logs = [log(), log({ id: "l2" }), log({ id: "l3" })];
    expect(calculateCompletionRate(rituals, logs, 2)).toBe(75);
    expect(calculateCompletionRate([], logs, 7)).toBe(0);
    expect(calculateCompletionRate(rituals, logs, 0)).toBe(0);
  });

  it("detects daily completion only for the same day", () => {
    const daily = ritual({ frequency: "daily" });
    expect(isRitualCompleted(daily, [log({ date: "2026-11-13" })], NOW)).toBe(true);
    expect(isRitualCompleted(daily, [log({ date: "2026-11-12" })], NOW)).toBe(false);
  });

  it("detects weekly completion within the same Monday-based week", () => {
    const weekly = ritual({ frequency: "weekly" });
    expect(isRitualCompleted(weekly, [log({ date: "2026-11-09" })], NOW)).toBe(true);
    expect(isRitualCompleted(weekly, [log({ date: "2026-11-08" })], NOW)).toBe(false);
  });
});
