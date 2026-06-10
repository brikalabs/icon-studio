import { describe, expect, test } from "bun:test";
import { getLucideIconNode, getLucideIconTags, lucideIconNames, serializeIconNode } from "./lucide";

describe("lucide data", () => {
  test("exposes the canonical kebab-case catalogue", () => {
    expect(lucideIconNames.length).toBeGreaterThan(1500);
    expect(lucideIconNames).toContain("bell");
    expect(lucideIconNames).toContain("axis-3d");
  });

  test("looks up icon nodes by name", () => {
    const bell = getLucideIconNode("bell");
    expect(bell).toBeDefined();
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
