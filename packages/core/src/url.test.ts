import { describe, expect, test } from "bun:test";
import { createDefaultIconSpec, type IconSpec } from "./types";
import { specFromSearchParams, specToSearchParams } from "./url";

describe("URL codec", () => {
  test("round-trips a lucide spec losslessly", () => {
    const spec: IconSpec = {
      canvasSize: 1024,
      background: { type: "linear", from: "#FF512F", to: "#F09819", angle: 120 },
      icon: { type: "lucide", name: "rocket" },
      iconColor: "#0A0A0A",
      iconScale: 0.4,
      offsetX: 12,
      offsetY: -8,
      strokeWidth: 1.75,
    };
    expect(specFromSearchParams(specToSearchParams(spec))).toEqual(spec);
  });

  test("round-trips solid and radial backgrounds", () => {
    const solid: IconSpec = {
      ...createDefaultIconSpec(),
      background: { type: "solid", color: "#18181B" },
    };
    expect(specFromSearchParams(specToSearchParams(solid))).toEqual(solid);

    const radial: IconSpec = {
      ...createDefaultIconSpec(),
      background: { type: "radial", from: "#F27121", to: "#8A2387" },
    };
    expect(specFromSearchParams(specToSearchParams(radial))).toEqual(radial);
  });

  test("empty params decode to the default spec", () => {
    expect(specFromSearchParams(new URLSearchParams())).toEqual(createDefaultIconSpec());
  });

  test("malformed values fall back to defaults instead of throwing", () => {
    const params = new URLSearchParams(
      "size=banana&bg=linear&from=zzz&to=123456&angle=NaN&scale=-4&sw=99",
    );
    const decoded = specFromSearchParams(params);
    expect(decoded).toEqual(createDefaultIconSpec());
  });

  test("custom icons are not serialized and decode to the default icon", () => {
    const spec: IconSpec = {
      ...createDefaultIconSpec(),
      icon: { type: "custom", svg: "<svg viewBox='0 0 1 1'></svg>" },
    };
    const params = specToSearchParams(spec);
    expect(params.has("icon")).toBe(false);
    expect(specFromSearchParams(params).icon).toEqual({ type: "lucide", name: "bell" });
  });
});
