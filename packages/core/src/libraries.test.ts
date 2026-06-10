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

beforeAll(async () => {
  await Promise.all([
    ensureIconLibrary("tabler"),
    ensureIconLibrary("hero"),
    ensureIconLibrary("brand"),
  ]);
});

describe("icon library registry", () => {
  test("lists the five libraries in display order", () => {
    expect(iconLibraries.map((library) => library.id)).toEqual([
      "lucide",
      "tabler",
      "hero",
      "brand",
      "iconify",
    ]);
  });

  test("lucide is ready without loading", () => {
    expect(isIconLibraryReady("lucide")).toBe(true);
  });

  test("catalogue sizes", () => {
    expect(getIconNames("lucide").length).toBeGreaterThan(1500);
    expect(getIconNames("tabler").length).toBeGreaterThan(5000);
    expect(getIconNames("hero").length).toBeGreaterThan(300);
    expect(getIconNames("brand").length).toBeGreaterThan(3000);
  });

  test("stroke libraries expose stroke glyphs on the 24 grid", () => {
    for (const library of ["lucide", "tabler", "hero"] as const) {
      const glyph = getIconGlyph(library, "bell");
      expect(glyph?.kind).toBe("stroke");
      if (glyph?.kind === "stroke") {
        expect(glyph.node.length).toBeGreaterThan(0);
      }
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
    expect(getIconTerms("tabler", "bell").length).toBeGreaterThan(0);
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

  test("searches every library", () => {
    expect(searchIcons("tabler", "bell", 25)[0]).toBe("bell");
    expect(searchIcons("hero", "bell", 25)[0]).toBe("bell");
    expect(searchIcons("brand", "spotify", 25)).toContain("spotify");
  });

  test("matches keyword terms, not just names", () => {
    expect(searchIcons("lucide", "alarm", 25).length).toBeGreaterThan(0);
  });

  test("empty query returns the full catalogue", () => {
    expect(searchIcons("lucide", " ").length).toBeGreaterThan(1500);
    expect(searchIcons("tabler", "").length).toBeGreaterThan(5000);
  });
});
