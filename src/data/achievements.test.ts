import { describe, expect, it } from "vitest";
import type { Ritual, RitualLog } from "@/types";
import { ACHIEVEMENTS, calculateAchievementProgress } from "./achievements";

function achievement(id: string) {
  const found = ACHIEVEMENTS.find((item) => item.id === id);
  if (!found) throw new Error(`Missing achievement ${id}`);
  return found;
}

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

describe("achievement progress", () => {
  it("uses the highest streak", () => {
    expect(
      calculateAchievementProgress(achievement("ach-streak-7"), {
        rituals: [ritual({ streak: 3 }), ritual({ id: "r2", streak: 9 })],
        logs: [],
        essence: 0,
      }),
    ).toBe(7);
  });

  it("counts completed logs for completion achievements", () => {
    const logs = Array.from({ length: 120 }, (_, index) => log({ id: `l${index}` }));
    expect(
      calculateAchievementProgress(achievement("ach-complete-100"), {
        rituals: [ritual()],
        logs,
        essence: 0,
      }),
    ).toBe(100);
  });

  it("counts created rituals for creation achievements", () => {
    const rituals = Array.from({ length: 12 }, (_, index) => ritual({ id: `r${index}` }));
    expect(
      calculateAchievementProgress(achievement("ach-rituals-10"), {
        rituals,
        logs: [],
        essence: 0,
      }),
    ).toBe(10);
  });

  it("counts posts for social achievements", () => {
    expect(
      calculateAchievementProgress(achievement("ach-social-10"), {
        rituals: [],
        logs: [],
        essence: 0,
        posts: [{}, {}, {}],
      }),
    ).toBe(3);
  });

  it("counts completed difficulties", () => {
    const rituals = [
      ritual({ id: "r1", difficulty: "novice" }),
      ritual({ id: "r2", difficulty: "master" }),
    ];
    expect(
      calculateAchievementProgress(achievement("ach-all-difficulties"), {
        rituals,
        logs: [log({ id: "l1", ritualId: "r1" }), log({ id: "l2", ritualId: "r2" })],
        essence: 0,
      }),
    ).toBe(2);
  });

  it("requires seven days of full completion for a perfect week", () => {
    const rituals = [ritual()];
    const completeWeek = Array.from({ length: 7 }, (_, index) =>
      log({ id: `l${index}`, date: `2026-11-${String(7 + index).padStart(2, "0")}` }),
    );
    expect(
      calculateAchievementProgress(achievement("ach-perfect-week"), {
        rituals,
        logs: completeWeek,
        essence: 0,
      }),
    ).toBe(7);
    expect(
      calculateAchievementProgress(achievement("ach-perfect-week"), {
        rituals,
        logs: completeWeek.slice(0, 6),
        essence: 0,
      }),
    ).toBe(6);
  });
});
