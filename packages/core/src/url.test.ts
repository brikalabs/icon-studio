import { describe, expect, test } from "bun:test";
import { createDefaultIconSpec, type IconSpec } from "./types";
import { specFromSearchParams, specToSearchParams } from "./url";

function roundTrip(spec: IconSpec): IconSpec {
  return specFromSearchParams(specToSearchParams(spec));
}

describe("URL codec", () => {
  test("the default spec serializes to an empty query string", () => {
    expect(specToSearchParams(createDefaultIconSpec()).toString()).toBe("");
  });

  test("changing only the icon produces a single short param", () => {
    const spec = { ...createDefaultIconSpec(), icon: { type: "lucide", name: "rocket" } } as const;
    expect(specToSearchParams(spec).toString()).toBe("i=rocket");
  });

  test("a preset background encodes as its id", () => {
    const spec: IconSpec = {
      ...createDefaultIconSpec(),
      background: {
        type: "linear",
        stops: [
          { color: "#FF512F", offset: 0 },
          { color: "#F09819", offset: 1 },
        ],
        angle: 45,
      },
    };
    expect(specToSearchParams(spec).toString()).toBe("p=sunset");
    expect(roundTrip(spec)).toEqual(spec);
  });

  test("evenly spaced gradient stops pack without offsets", () => {
    const spec: IconSpec = {
      ...createDefaultIconSpec(),
      background: {
        type: "linear",
        stops: [
          { color: "#112233", offset: 0 },
          { color: "#445566", offset: 0.5 },
          { color: "#778899", offset: 1 },
        ],
        angle: 45,
      },
    };
    expect(specToSearchParams(spec).get("g")).toBe("112233-445566-778899");
    expect(roundTrip(spec)).toEqual(spec);
  });

  test("uneven stops keep integer-percent offsets", () => {
    const spec: IconSpec = {
      ...createDefaultIconSpec(),
      background: {
        type: "linear",
        stops: [
          { color: "#000000", offset: 0 },
          { color: "#FF0000", offset: 0.25 },
          { color: "#FFFFFF", offset: 1 },
        ],
        angle: 120,
      },
    };
    const params = specToSearchParams(spec);
    expect(params.get("g")).toBe("000000_0-FF0000_25-FFFFFF_100");
    expect(params.get("a")).toBe("120");
    expect(roundTrip(spec)).toEqual(spec);
  });

  test("round-trips a fully customized spec", () => {
    const spec: IconSpec = {
      canvasSize: 1024,
      background: {
        type: "radial",
        stops: [
          { color: "#F27121", offset: 0 },
          { color: "#8A2387", offset: 1 },
        ],
        cx: 0.3,
        cy: 0.7,
        radius: 0.9,
      },
      icon: { type: "brand", name: "github" },
      iconColor: "#0A0A0A",
      iconScale: 0.4,
      offsetX: 12,
      offsetY: -8,
      rotation: 30,
      strokeWidth: 1.75,
      noise: 0.25,
      noiseScale: 1.5,
      glare: 0.4,
    };
    expect(roundTrip(spec)).toEqual(spec);
  });

  test("round-trips monogram text icons compactly", () => {
    const spec: IconSpec = {
      ...createDefaultIconSpec(),
      icon: { type: "text", text: "BR", fontFamily: "mono", fontWeight: "800" },
    };
    expect(specToSearchParams(spec).toString()).toBe("t=BR&tf=mono&tw=800");
    expect(roundTrip(spec)).toEqual(spec);

    const defaults: IconSpec = {
      ...createDefaultIconSpec(),
      icon: { type: "text", text: "A", fontFamily: "sans", fontWeight: "700" },
    };
    expect(specToSearchParams(defaults).toString()).toBe("t=A");
    expect(roundTrip(defaults)).toEqual(defaults);
  });

  test("solid backgrounds and non-lucide libraries stay compact", () => {
    const spec: IconSpec = {
      ...createDefaultIconSpec(),
      background: { type: "solid", color: "#101010" },
      icon: { type: "brand", name: "spotify" },
    };
    expect(specToSearchParams(spec).toString()).toBe("i=spotify&l=brand&c=101010");

    const tabler: IconSpec = {
      ...createDefaultIconSpec(),
      icon: { type: "tabler", name: "bell" },
    };
    expect(specToSearchParams(tabler).toString()).toBe("i=bell&l=tabler");
    expect(roundTrip(tabler)).toEqual(tabler);
  });

  test("an unknown library falls back to lucide", () => {
    const decoded = specFromSearchParams(new URLSearchParams("i=bell&l=nope"));
    expect(decoded.icon).toEqual({ type: "lucide", name: "bell" });
  });

  test("empty params decode to the default spec", () => {
    expect(specFromSearchParams(new URLSearchParams())).toEqual(createDefaultIconSpec());
  });

  test("malformed values fall back to defaults instead of throwing", () => {
    const params = new URLSearchParams("sz=banana&g=zzz_0-123456&a=NaN&sc=-400&sw=99&ro=720&n=200");
    expect(specFromSearchParams(params)).toEqual(createDefaultIconSpec());
  });

  test("an unknown preset id falls back to the default background", () => {
    const decoded = specFromSearchParams(new URLSearchParams("p=not-a-preset"));
    expect(decoded.background).toEqual(createDefaultIconSpec().background);
  });

  test("a single gradient stop is rejected", () => {
    const decoded = specFromSearchParams(new URLSearchParams("g=3F5EFB"));
    expect(decoded.background).toEqual(createDefaultIconSpec().background);
  });

  test("custom icons are not serialized and decode to the default icon", () => {
    const spec: IconSpec = {
      ...createDefaultIconSpec(),
      icon: { type: "custom", svg: "<svg viewBox='0 0 1 1'></svg>" },
    };
    const params = specToSearchParams(spec);
    expect(params.toString()).toBe("");
    expect(specFromSearchParams(params).icon).toEqual({ type: "lucide", name: "bell" });
  });
});
