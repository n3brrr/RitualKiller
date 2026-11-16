import { describe, expect, it } from "vitest";
import { en } from "../en";
import { es } from "../es";
import { interpolate } from "../keys";

const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

describe("i18n dictionaries", () => {
  it("have no empty translations", () => {
    for (const [key, value] of Object.entries(en)) expect(value, key).not.toBe("");
    for (const [key, value] of Object.entries(es)) expect(value, key).not.toBe("");
  });

  it("use the same placeholders in both languages", () => {
    for (const key of Object.keys(es) as Array<keyof typeof es>) {
      expect(placeholders(en[key]), key).toEqual(placeholders(es[key]));
    }
  });

  it("define both plural forms", () => {
    const keys = Object.keys(es);
    for (const key of keys.filter((item) => item.endsWith(".one"))) {
      expect(keys, key).toContain(key.replace(/\.one$/, ".other"));
    }
  });
});

describe("interpolate", () => {
  it("replaces known placeholders and keeps unknown ones", () => {
    expect(interpolate("{a} and {b}", { a: 1 })).toBe("1 and {b}");
    expect(interpolate("plain")).toBe("plain");
  });
});
