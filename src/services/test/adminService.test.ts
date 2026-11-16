import { describe, expect, it } from "vitest";
import { likePattern } from "../adminService";

describe("likePattern", () => {
  it("escapes LIKE wildcards and backslashes", () => {
    expect(likePattern("a_b")).toBe("%a\\_b%");
    expect(likePattern("100%")).toBe("%100\\%%");
    expect(likePattern("back\\slash")).toBe("%back\\\\slash%");
    expect(likePattern("plain")).toBe("%plain%");
  });
});
