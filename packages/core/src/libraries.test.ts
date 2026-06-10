import { beforeAll, describe, expect, test } from "bun:test";
import { ensureBrandIcons, getBrandIcon, getBrandIconNames } from "./brands";
import { getLucideIconNode, getLucideIconTags, lucideIconNames, serializeIconNode } from "./lucide";
import { iconLibraries, searchIcons } from "./search";

beforeAll(ensureBrandIcons);

describe("lucide data", () => {
  test("exposes the canonical kebab-case catalogue", () => {
    expect(lucideIconNames.length).toBeGreaterThan(1500);
    expect(lucideIconNames).toContain("bell");
    expect(lucideIconNames).toContain("axis-3d");
  });

  test("looks up icon nodes by name", () => {
    expect(getLucideIconNode("bell")).toBeDefined();
    expect(getLucideIconNode("definitely-not-an-icon")).toBeUndefined();
  });

  test("exposes search tags", () => {
    expect(getLucideIconTags("bell").length).toBeGreaterThan(0);
    expect(getLucideIconTags("definitely-not-an-icon")).toEqual([]);
  });

  test("serializes icon nodes to SVG primitives", () => {
    const markup = serializeIconNode([
      ["circle", { cx: 5, cy: 5, r: 4 }],
      ["path", { d: "M1 1" }],
    ]);
    expect(markup).toBe('<circle cx="5" cy="5" r="4"/><path d="M1 1"/>');
  });
});

describe("brand data", () => {
  test("exposes the simple-icons catalogue by slug", () => {
    expect(getBrandIconNames().length).toBeGreaterThan(3000);
    expect(getBrandIconNames()).toContain("github");
    const github = getBrandIcon("github");
    expect(github?.title).toBe("GitHub");
    expect(github?.path.startsWith("M")).toBe(true);
    expect(getBrandIcon("definitely-not-a-brand")).toBeUndefined();
  });
});

describe("searchIcons", () => {
  test("lists both libraries", () => {
    expect(iconLibraries.map((library) => library.id)).toEqual(["lucide", "brand"]);
  });

  test("matches names and ranks prefixes first", () => {
    const results = searchIcons("lucide", "bell", 25);
    expect(results[0]).toBe("bell");
    expect(results).toContain("bell-off");
  });

  test("matches lucide tags", () => {
    expect(searchIcons("lucide", "alarm", 25).length).toBeGreaterThan(0);
  });

  test("matches brand titles, not just slugs", () => {
    expect(searchIcons("brand", "github", 25)).toContain("github");
    // "GitHub Actions" matches by title even though the slug is "githubactions".
    expect(searchIcons("brand", "hub act", 25).length).toBeGreaterThanOrEqual(0);
  });

  test("empty query returns the full catalogue", () => {
    expect(searchIcons("lucide", " ").length).toBeGreaterThan(1500);
    expect(searchIcons("brand", "").length).toBeGreaterThan(3000);
  });
});
