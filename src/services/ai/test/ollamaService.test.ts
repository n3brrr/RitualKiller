import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fallbackSuggestions,
  generateRitualSuggestions,
  parseOllamaResponse,
} from "../ollamaService";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ollama service", () => {
  it("parses a JSON array embedded in prose and sanitizes values", () => {
    const suggestions = parseOllamaResponse(`
      Here are your rituals:
      [
        { "title": "  Dawn run  ", "description": "Run before sunrise", "difficulty": "adept" },
        { "title": "", "description": "invalid", "difficulty": "master" },
        { "title": "Void", "description": "Sit still", "difficulty": "impossible" }
      ]
    `);
    expect(suggestions).toEqual([
      { title: "Dawn run", description: "Run before sunrise", difficulty: "adept" },
      { title: "Void", description: "Sit still", difficulty: "novice" },
    ]);
  });

  it("returns an empty list for malformed output", () => {
    expect(parseOllamaResponse("no json here")).toEqual([]);
    expect(parseOllamaResponse("[{broken")).toEqual([]);
  });

  it("provides three local fallbacks", () => {
    const suggestions = fallbackSuggestions("aprender piano");
    expect(suggestions).toHaveLength(3);
    expect(suggestions.every((item) => item.title.length > 0)).toBe(true);
  });

  it("falls back when the proxy is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const suggestions = await generateRitualSuggestions("leer más");
    expect(suggestions).toHaveLength(3);
  });

  it("uses the model response when available", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response:
          '[{"title":"Cold Shower","description":"Two minutes","difficulty":"novice"}]',
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const suggestions = await generateRitualSuggestions("disciplina");
    expect(suggestions).toEqual([
      { title: "Cold Shower", description: "Two minutes", difficulty: "novice" },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/ollama/api/generate",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns fallbacks for an empty goal without calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const suggestions = await generateRitualSuggestions("   ");
    expect(suggestions).toHaveLength(3);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
