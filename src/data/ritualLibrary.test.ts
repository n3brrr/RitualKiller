import { describe, expect, it } from "vitest";
import { es } from "@/i18n/es";
import type { TranslationKey } from "@/i18n";
import { filterTemplates, RITUAL_LIBRARY, templateText } from "./ritualLibrary";

const t = (key: TranslationKey) => es[key];
const base = {
  query: "",
  popularOnly: false,
  category: "all",
  difficulty: "all",
} as const;

describe("ritual library", () => {
  it("has a translation for every template", () => {
    for (const template of RITUAL_LIBRARY) {
      const { title, description } = templateText(template, t);
      expect(title).toBeTruthy();
      expect(description).toBeTruthy();
    }
  });

  it("searches translated text and keeps the popular filter", () => {
    const all = filterTemplates(RITUAL_LIBRARY, { ...base, query: "meditación" }, t);
    expect(all.map((item) => item.id)).toEqual(["lib-mental-1"]);

    const popularSearch = filterTemplates(
      RITUAL_LIBRARY,
      { ...base, query: "discipline", popularOnly: true },
      t,
    );
    expect(popularSearch.every((item) => item.popular)).toBe(true);
    expect(popularSearch.length).toBeGreaterThan(0);
  });
});
