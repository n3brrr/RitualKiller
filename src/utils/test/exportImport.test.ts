import { describe, expect, it } from "vitest";
import type { Ritual, RitualLog } from "@/types";
import { csvCell, exportData, exportToCSV, importData } from "../exportImport";

const ritual: Ritual = {
  id: "r1",
  user_id: "u1",
  title: '=HYPERLINK("http://evil")',
  description: "desc",
  difficulty: "adept",
  frequency: "daily",
  streak: 2,
  bestStreak: 2,
  essenceReward: 25,
  created_at: "2026-01-01T00:00:00.000Z",
};

const log: RitualLog = {
  id: "l1",
  ritualId: "r1",
  user_id: "u1",
  date: "2026-11-13",
  essence_gained: 25,
  protected: false,
};

describe("export/import helpers", () => {
  it("escapes CSV formulas and quotes", () => {
    expect(csvCell("=SUM(A1:A2)")).toBe('"\'=SUM(A1:A2)"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell(42)).toBe('"42"');
  });

  it("exports logs with escaped ritual titles", () => {
    const csv = exportToCSV([ritual], [log], {
      date: "Fecha",
      ritual: "Ritual",
      difficulty: "Dificultad",
      essence: "Esencia",
      unknown: "?",
      difficultyName: (value) => value.toUpperCase(),
    });
    expect(csv).toContain("ADEPT");
    expect(csv.split("\n")[0]).toContain("Fecha");
    expect(csv).toContain("'=HYPERLINK");
  });

  it("round-trips a valid backup", () => {
    const raw = exportData([ritual], [log]);
    const parsed = importData(raw);
    expect(parsed?.rituals[0]?.title).toBe(ritual.title);
    expect(parsed?.logs[0]?.date).toBe(log.date);
  });

  it("rejects oversized or incomplete backups", () => {
    expect(
      importData(
        JSON.stringify({
          rituals: Array.from({ length: 201 }, (_, i) => ({ ...ritual, id: `r${i}` })),
          logs: [],
        }),
      ),
    ).toBeNull();
    expect(
      importData(
        JSON.stringify({
          rituals: [{ title: "No id", difficulty: "novice", frequency: "daily" }],
          logs: [],
        }),
      ),
    ).toBeNull();
  });

  it("rejects broken backups instead of throwing", () => {
    expect(importData("not json")).toBeNull();
    expect(
      importData(
        JSON.stringify({
          rituals: [{ title: "x", difficulty: "impossible", frequency: "daily" }],
          logs: [],
        }),
      ),
    ).toBeNull();
    expect(
      importData(
        JSON.stringify({
          rituals: [],
          logs: [{ ritualId: "r1", date: "13/11/2026" }],
        }),
      ),
    ).toBeNull();
  });
});
