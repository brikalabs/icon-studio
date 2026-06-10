import { describe, expect, test } from "bun:test";
import {
  configureIconify,
  ensureIconifyIcons,
  getIconifyIcon,
  isIconifyIconMissing,
  searchIconifyIcons,
} from "./iconify";
import { getIconGlyph, getIconNames, isIconLibraryReady } from "./libraries";
import { buildIconSvg } from "./svg";

const requests: string[] = [];

configureIconify({
  fetcher: (url) => {
    requests.push(url);
    const parsed = new URL(url);
    if (parsed.pathname === "/search") {
      return Promise.resolve(Response.json({ icons: ["mdi:home", "mdi:home-outline"] }));
    }
    if (parsed.pathname === "/mdi.json") {
      return Promise.resolve(
        Response.json({
          prefix: "mdi",
          width: 24,
          height: 24,
          icons: {
            home: { body: '<path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8z"/>' },
            wide: { body: "<path d='M0 0h48v12H0z'/>", width: 48, height: 12 },
          },
        }),
      );
    }
    return Promise.resolve(new Response("not found", { status: 404 }));
  },
});

describe("iconify", () => {
  test("ensure fetches per-prefix batches and caches glyphs", async () => {
    await ensureIconifyIcons(["mdi:home", "mdi:wide", "mdi:nope"]);
    expect(getIconifyIcon("mdi:home")).toEqual({
      body: '<path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8z"/>',
      width: 24,
      height: 24,
    });
    expect(getIconifyIcon("mdi:wide")?.width).toBe(48);
    expect(isIconifyIconMissing("mdi:nope")).toBe(true);

    const fetches = requests.filter((url) => url.includes("/mdi.json")).length;
    await ensureIconifyIcons(["mdi:home"]);
    expect(requests.filter((url) => url.includes("/mdi.json")).length).toBe(fetches);
  });

  test("names without a prefix are rejected without a request", async () => {
    await ensureIconifyIcons(["noprefix"]);
    expect(isIconifyIconMissing("noprefix")).toBe(true);
    expect(requests.some((url) => url.includes("noprefix"))).toBe(false);
  });

  test("search returns full prefix:name entries", async () => {
    const results = await searchIconifyIcons("home", 10);
    expect(results).toEqual(["mdi:home", "mdi:home-outline"]);
    expect(searchIconifyIcons("  ")).resolves.toEqual([]);
  });

  test("the registry exposes cached iconify icons as body glyphs", async () => {
    await ensureIconifyIcons(["mdi:home"]);
    expect(isIconLibraryReady("iconify")).toBe(true);
    expect(getIconNames("iconify")).toContain("mdi:home");
    expect(getIconGlyph("iconify", "mdi:home")?.kind).toBe("body");
  });

  test("buildIconSvg renders body glyphs with color and grid scaling", async () => {
    await ensureIconifyIcons(["mdi:home", "mdi:wide"]);
    const svg = buildIconSvg({
      icon: { type: "iconify", name: "mdi:home" },
      iconColor: "#FFD200",
      canvasSize: 480,
      iconScale: 0.5,
    });
    // 240px box over a 24 grid: scale 10, centered at 120.
    expect(svg).toContain('transform="translate(120 120) scale(10)"');
    expect(svg).toContain('color="#FFD200"');
    expect(svg).toContain('fill="currentColor"');

    // Non-square grid (48x12) scales by width and centers vertically.
    const wide = buildIconSvg({
      icon: { type: "iconify", name: "mdi:wide" },
      canvasSize: 480,
      iconScale: 0.5,
    });
    expect(wide).toContain("scale(5)");

    expect(() => buildIconSvg({ icon: { type: "iconify", name: "mdi:nope" } })).toThrow(
      'unknown iconify icon "mdi:nope"',
    );
  });
});
