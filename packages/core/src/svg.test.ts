import { beforeAll, describe, expect, test } from "bun:test";
import { ensureIconLibrary } from "./libraries";
import { buildIconSvg, linearGradientEndpoints, suggestFileName } from "./svg";
import { createDefaultIconSpec } from "./types";

beforeAll(async () => {
  await Promise.all([
    ensureIconLibrary("tabler"),
    ensureIconLibrary("hero"),
    ensureIconLibrary("brand"),
  ]);
});

describe("buildIconSvg", () => {
  test("builds a square SVG with a linear gradient by default", () => {
    const svg = buildIconSvg({});
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
    expect(svg).toContain('width="512"');
    expect(svg).toContain('height="512"');
    expect(svg).toContain('viewBox="0 0 512 512"');
    expect(svg).toContain("<linearGradient");
    expect(svg).toContain('stop-color="#3F5EFB"');
    expect(svg).toContain('stop-color="#FC466B"');
    expect(svg).toContain('fill="url(#icon-studio-bg)"');
    expect(svg).toContain("<path");
  });

  test("solid background renders a plain rect without defs", () => {
    const svg = buildIconSvg({ background: { type: "solid", color: "#18181B" } });
    expect(svg).toContain('<rect width="512" height="512" fill="#18181B"/>');
    expect(svg).not.toContain("<defs>");
  });

  test("multi-stop gradients render every stop in offset order", () => {
    const svg = buildIconSvg({
      background: {
        type: "linear",
        angle: 90,
        stops: [
          { color: "#FFFFFF", offset: 1 },
          { color: "#000000", offset: 0 },
          { color: "#FF0000", offset: 0.25 },
        ],
      },
    });
    expect(svg).toContain(
      '<stop offset="0" stop-color="#000000"/><stop offset="0.25" stop-color="#FF0000"/><stop offset="1" stop-color="#FFFFFF"/>',
    );
  });

  test("radial background honors center and radius", () => {
    const svg = buildIconSvg({
      background: {
        type: "radial",
        stops: [
          { color: "#F27121", offset: 0 },
          { color: "#8A2387", offset: 1 },
        ],
        cx: 0.3,
        cy: 0.2,
        radius: 1,
      },
    });
    expect(svg).toContain('<radialGradient id="icon-studio-bg" cx="0.3" cy="0.2" r="1">');
  });

  test("icon layer centers, scales, and offsets the lucide glyph", () => {
    const svg = buildIconSvg({
      icon: { type: "lucide", name: "bell" },
      canvasSize: 512,
      iconScale: 0.5,
      offsetX: 10,
      offsetY: -20,
    });
    // 512 * 0.5 = 256 icon box, centered at 128 then shifted by the offsets.
    expect(svg).toContain('transform="translate(138 108) scale(10.667)"');
    expect(svg).toContain('stroke="#FFFFFF"');
    expect(svg).toContain('stroke-width="2"');
  });

  test("rotation rotates around the icon center", () => {
    const svg = buildIconSvg({ rotation: 45 });
    expect(svg).toContain("rotate(45 12 12)");
  });

  test("brand icons render as a single filled path", () => {
    const svg = buildIconSvg({ icon: { type: "brand", name: "github" }, iconColor: "#FFD200" });
    expect(svg).toContain('fill="#FFD200"');
    expect(svg).not.toContain("stroke-linecap");
    expect(svg).toContain("<path d=");
  });

  test("tabler and hero icons render as stroked glyphs", () => {
    for (const library of ["tabler", "hero"] as const) {
      const svg = buildIconSvg({ icon: { type: library, name: "bell" } });
      expect(svg).toContain('stroke="#FFFFFF"');
      expect(svg).toContain('stroke-linecap="round"');
    }
  });

  test("noise adds a turbulence grain layer above the icon", () => {
    const svg = buildIconSvg({ noise: 0.4 });
    expect(svg).toContain("<feTurbulence");
    expect(svg).toContain('opacity="0.2"');
    const grainAt = svg.indexOf('filter="url(#icon-studio-noise)"');
    const iconAt = svg.indexOf("<g transform=");
    expect(grainAt).toBeGreaterThan(iconAt);
  });

  test("noise 0 leaves the document untouched", () => {
    expect(buildIconSvg({ noise: 0 })).not.toContain("feTurbulence");
  });

  test("unknown icon names throw a clear error naming the library", () => {
    expect(() => buildIconSvg({ icon: { type: "lucide", name: "not-a-real-icon" } })).toThrow(
      'unknown lucide icon "not-a-real-icon"',
    );
    expect(() => buildIconSvg({ icon: { type: "tabler", name: "not-a-real-icon" } })).toThrow(
      'unknown tabler icon "not-a-real-icon"',
    );
    expect(() => buildIconSvg({ icon: { type: "brand", name: "not-a-real-brand" } })).toThrow(
      'unknown brand icon "not-a-real-brand"',
    );
  });

  test("custom SVG is embedded as a positioned nested svg", () => {
    const svg = buildIconSvg({
      canvasSize: 100,
      iconScale: 0.5,
      icon: {
        type: "custom",
        svg: '<svg viewBox="0 0 10 10" fill="red"><circle cx="5" cy="5" r="4"/></svg>',
      },
    });
    expect(svg).toContain('x="25" y="25" width="50" height="50" viewBox="0 0 10 10"');
    expect(svg).toContain('fill="red"');
    expect(svg).toContain('<circle cx="5" cy="5" r="4"/>');
  });

  test("custom SVG rotation wraps the embed in a rotated group", () => {
    const svg = buildIconSvg({
      canvasSize: 100,
      iconScale: 0.5,
      rotation: 90,
      icon: { type: "custom", svg: '<svg viewBox="0 0 10 10"><rect width="1"/></svg>' },
    });
    expect(svg).toContain('<g transform="rotate(90 50 50)">');
  });

  test("custom SVG active content is stripped", () => {
    const svg = buildIconSvg({
      icon: {
        type: "custom",
        svg: '<svg viewBox="0 0 10 10"><script>alert(1)</script><rect onclick="evil()" width="1"/></svg>',
      },
    });
    expect(svg).not.toContain("<script");
    expect(svg).not.toContain("onclick");
    expect(svg).toContain("<rect");
  });

  test("rejects custom input that is not an svg document", () => {
    expect(() => buildIconSvg({ icon: { type: "custom", svg: "<div>nope</div>" } })).toThrow(
      "missing <svg>",
    );
  });
});

describe("linearGradientEndpoints", () => {
  test("90 degrees points left-to-right", () => {
    const { x1, y1, x2, y2 } = linearGradientEndpoints(90);
    expect(x1).toBeCloseTo(0);
    expect(y1).toBeCloseTo(0.5);
    expect(x2).toBeCloseTo(1);
    expect(y2).toBeCloseTo(0.5);
  });

  test("0 degrees points bottom-to-top", () => {
    const { x1, y1, x2, y2 } = linearGradientEndpoints(0);
    expect(x1).toBeCloseTo(0.5);
    expect(y1).toBeCloseTo(1);
    expect(x2).toBeCloseTo(0.5);
    expect(y2).toBeCloseTo(0);
  });

  test("45 degrees points bottom-left to top-right", () => {
    const { x1, y1, x2, y2 } = linearGradientEndpoints(45);
    expect(x1).toBeLessThan(0.5);
    expect(y1).toBeGreaterThan(0.5);
    expect(x2).toBeGreaterThan(0.5);
    expect(y2).toBeLessThan(0.5);
  });
});

describe("suggestFileName", () => {
  test("uses the icon name for lucide and brand icons", () => {
    expect(suggestFileName(createDefaultIconSpec())).toBe("bell.svg");
    expect(suggestFileName({ icon: { type: "brand", name: "github" } })).toBe("github.svg");
  });

  test("falls back for custom icons", () => {
    expect(suggestFileName({ icon: { type: "custom", svg: "<svg></svg>" } })).toBe("icon.svg");
  });
});
