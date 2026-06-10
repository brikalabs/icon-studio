import { beforeAll, describe, expect, test } from "bun:test";
import { serializeIconNode } from "./icon-node";
import {
  ensureIconLibrary,
  getIconGlyph,
  getIconNames,
  getIconTerms,
  iconLibraries,
  isIconLibraryReady,
} from "./libraries";
import { searchIcons } from "./search";

beforeAll(() => ensureIconLibrary("brand"));

describe("icon library registry", () => {
  test("lists the three libraries in display order", () => {
    expect(iconLibraries.map((library) => library.id)).toEqual(["lucide", "brand", "iconify"]);
  });

  test("lucide and iconify are ready without loading", () => {
    expect(isIconLibraryReady("lucide")).toBe(true);
    expect(isIconLibraryReady("iconify")).toBe(true);
  });

  test("catalogue sizes", () => {
    expect(getIconNames("lucide").length).toBeGreaterThan(1500);
    expect(getIconNames("brand").length).toBeGreaterThan(3000);
  });

  test("lucide exposes stroke glyphs on the 24 grid", () => {
    const glyph = getIconGlyph("lucide", "bell");
    expect(glyph?.kind).toBe("stroke");
    if (glyph?.kind === "stroke") {
      expect(glyph.node.length).toBeGreaterThan(0);
    }
  });

  test("brands expose filled single-path glyphs", () => {
    const glyph = getIconGlyph("brand", "github");
    expect(glyph?.kind).toBe("fill");
    if (glyph?.kind === "fill") {
      expect(glyph.node[0]?.[0]).toBe("path");
    }
  });

  test("unknown names return undefined", () => {
    expect(getIconGlyph("lucide", "definitely-not-an-icon")).toBeUndefined();
    expect(getIconGlyph("brand", "definitely-not-a-brand")).toBeUndefined();
  });

  test("search terms come from tags and brand titles", () => {
    expect(getIconTerms("lucide", "bell").length).toBeGreaterThan(0);
    expect(getIconTerms("brand", "github")).toEqual(["github"]);
  });

  test("serializes icon nodes to SVG primitives", () => {
    const markup = serializeIconNode([
      ["circle", { cx: 5, cy: 5, r: 4 }],
      ["path", { d: "M1 1" }],
    ]);
    expect(markup).toBe('<circle cx="5" cy="5" r="4"/><path d="M1 1"/>');
  });
});

describe("searchIcons", () => {
  test("matches names and ranks prefixes first", () => {
    const results = searchIcons("lucide", "bell", 25);
    expect(results[0]).toBe("bell");
    expect(results).toContain("bell-off");
  });

  test("searches brands by slug", () => {
    expect(searchIcons("brand", "spotify", 25)).toContain("spotify");
  });

  test("matches keyword terms, not just names", () => {
    expect(searchIcons("lucide", "alarm", 25).length).toBeGreaterThan(0);
  });

  test("empty query returns the full catalogue", () => {
    expect(searchIcons("lucide", " ").length).toBeGreaterThan(1500);
    expect(searchIcons("brand", "").length).toBeGreaterThan(3000);
  });
});
