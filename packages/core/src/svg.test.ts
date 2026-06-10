import { describe, expect, test } from "bun:test";
import { buildIconSvg, linearGradientEndpoints, suggestFileName } from "./svg";
import { createDefaultIconSpec } from "./types";

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

  test("radial background renders a centered radial gradient", () => {
    const svg = buildIconSvg({ background: { type: "radial", from: "#F27121", to: "#8A2387" } });
    expect(svg).toContain('<radialGradient id="icon-studio-bg" cx="0.5" cy="0.5" r="0.7071">');
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

  test("stroke width and icon color are configurable", () => {
    const svg = buildIconSvg({ iconColor: "#FFD200", strokeWidth: 1.5 });
    expect(svg).toContain('stroke="#FFD200"');
    expect(svg).toContain('stroke-width="1.5"');
  });

  test("unknown lucide icon names throw a clear error", () => {
    expect(() => buildIconSvg({ icon: { type: "lucide", name: "not-a-real-icon" } })).toThrow(
      'unknown lucide icon "not-a-real-icon"',
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

  test("custom SVG without viewBox synthesizes one from width/height", () => {
    const svg = buildIconSvg({
      icon: { type: "custom", svg: '<svg width="32" height="32"><rect/></svg>' },
    });
    expect(svg).toContain('viewBox="0 0 32 32"');
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
  test("uses the lucide icon name", () => {
    expect(suggestFileName(createDefaultIconSpec())).toBe("bell.svg");
  });

  test("falls back for custom icons", () => {
    expect(suggestFileName({ icon: { type: "custom", svg: "<svg></svg>" } })).toBe("icon.svg");
  });
});
