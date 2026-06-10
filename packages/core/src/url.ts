import { backgroundPresets } from "./presets";
import {
  type Background,
  createDefaultIconSpec,
  type GradientStop,
  hexColorSchema,
  type IconSpec,
  iconLibraryIdSchema,
  iconSpecSchema,
} from "./types";

/**
 * Shareable-URL codec, optimized for short links:
 * - parameters equal to the default spec are omitted entirely;
 * - a background matching a preset is encoded as `p=<preset-id>`;
 * - gradient stops pack into one token (`g=3F5EFB-FC466B`), offsets only
 *   when stops are not evenly spaced (`g=000000_0-FF0000_25-FFFFFF_100`);
 * - fractions (offsets, scale, noise, radial geometry) quantize to integer
 *   percent, so encode(decode(url)) is stable.
 *
 * A default design therefore serializes to an empty query string, and a
 * typical link looks like `?i=rocket&p=sunset`. Pasted custom SVGs are
 * deliberately not serialized (they would not fit in a URL).
 *
 * Keys: i icon, l library (when not lucide), p preset, c solid color,
 * g/rg linear/radial stops, a angle, rc radial center, rr radial radius,
 * sz canvas, ic icon color, sc scale, x/y offset, ro rotation, sw stroke
 * width, n noise.
 */

const PERCENT = 100;

function percent(fraction: number): string {
  return String(Math.round(fraction * PERCENT));
}

function color(value: string): string {
  return value.replace(/^#/, "");
}

function readColor(raw: string | null): string | undefined {
  if (raw === null) {
    return undefined;
  }
  const parsed = hexColorSchema.safeParse(`#${raw}`);
  return parsed.success ? parsed.data : undefined;
}

function readNumber(raw: string | null): number | undefined {
  if (raw === null) {
    return undefined;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function isEvenlySpaced(stops: readonly GradientStop[]): boolean {
  const last = stops.length - 1;
  return stops.every(
    (stop, index) => Math.round(stop.offset * PERCENT) === Math.round((index / last) * PERCENT),
  );
}

function writeStops(stops: readonly GradientStop[]): string {
  const sorted = [...stops].sort((a, b) => a.offset - b.offset);
  if (isEvenlySpaced(sorted)) {
    return sorted.map((stop) => color(stop.color)).join("-");
  }
  return sorted.map((stop) => `${color(stop.color)}_${percent(stop.offset)}`).join("-");
}

function readStops(raw: string): GradientStop[] | undefined {
  const parts = raw.split("-");
  if (parts.length < 2) {
    return undefined;
  }
  const stops: GradientStop[] = [];
  for (const [index, part] of parts.entries()) {
    const [hex, offsetRaw] = part.split("_");
    const stopColor = readColor(hex ?? null);
    const explicit = offsetRaw === undefined ? undefined : readNumber(offsetRaw);
    if (offsetRaw !== undefined && explicit === undefined) {
      return undefined;
    }
    const offset = explicit === undefined ? index / (parts.length - 1) : explicit / PERCENT;
    if (!stopColor || offset < 0 || offset > 1) {
      return undefined;
    }
    stops.push({ color: stopColor, offset });
  }
  return stops;
}

function sameBackground(a: Background, b: Background): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function writeBackground(params: URLSearchParams, background: Background): void {
  const preset = backgroundPresets.find((entry) => sameBackground(entry.background, background));
  if (preset) {
    params.set("p", preset.id);
    return;
  }
  switch (background.type) {
    case "solid":
      params.set("c", color(background.color));
      return;
    case "linear":
      params.set("g", writeStops(background.stops));
      if (background.angle !== 45) {
        params.set("a", String(Math.round(background.angle)));
      }
      return;
    case "radial":
      params.set("rg", writeStops(background.stops));
      if (background.cx !== 0.5 || background.cy !== 0.5) {
        params.set("rc", `${percent(background.cx)}_${percent(background.cy)}`);
      }
      if (Math.round(background.radius * PERCENT) !== 71) {
        params.set("rr", percent(background.radius));
      }
  }
}

function readBackground(params: URLSearchParams, fallback: Background): Background {
  const preset = params.get("p");
  if (preset !== null) {
    const match = backgroundPresets.find((entry) => entry.id === preset);
    return match ? match.background : fallback;
  }
  const solid = readColor(params.get("c"));
  if (solid) {
    return { type: "solid", color: solid };
  }
  const linearStops = params.get("g");
  if (linearStops !== null) {
    const stops = readStops(linearStops);
    return stops ? { type: "linear", stops, angle: readNumber(params.get("a")) ?? 45 } : fallback;
  }
  const radialStops = params.get("rg");
  if (radialStops !== null) {
    const stops = readStops(radialStops);
    if (!stops) {
      return fallback;
    }
    const [cx, cy] = (params.get("rc") ?? "50_50").split("_").map((part) => readNumber(part));
    return {
      type: "radial",
      stops,
      cx: (cx ?? 50) / PERCENT,
      cy: (cy ?? 50) / PERCENT,
      radius: (readNumber(params.get("rr")) ?? 71) / PERCENT,
    };
  }
  return fallback;
}

export function specToSearchParams(spec: IconSpec): URLSearchParams {
  const defaults = createDefaultIconSpec();
  const params = new URLSearchParams();

  if (spec.icon.type !== "custom") {
    if (spec.icon.type !== "lucide" || spec.icon.name !== "bell") {
      params.set("i", spec.icon.name);
    }
    if (spec.icon.type !== "lucide") {
      params.set("l", spec.icon.type);
    }
  }
  if (!sameBackground(spec.background, defaults.background)) {
    writeBackground(params, spec.background);
  }
  if (spec.canvasSize !== defaults.canvasSize) {
    params.set("sz", String(spec.canvasSize));
  }
  if (spec.iconColor !== defaults.iconColor) {
    params.set("ic", color(spec.iconColor));
  }
  if (spec.iconScale !== defaults.iconScale) {
    params.set("sc", percent(spec.iconScale));
  }
  if (spec.offsetX !== 0) {
    params.set("x", String(Math.round(spec.offsetX)));
  }
  if (spec.offsetY !== 0) {
    params.set("y", String(Math.round(spec.offsetY)));
  }
  if (spec.rotation !== 0) {
    params.set("ro", String(Math.round(spec.rotation)));
  }
  if (spec.strokeWidth !== defaults.strokeWidth) {
    params.set("sw", String(spec.strokeWidth));
  }
  if (spec.noise !== 0) {
    params.set("n", percent(spec.noise));
  }
  return params;
}

/** Tolerant decode: anything missing or malformed falls back to defaults. */
export function specFromSearchParams(params: URLSearchParams): IconSpec {
  const defaults = createDefaultIconSpec();
  const library = iconLibraryIdSchema.safeParse(params.get("l") ?? "lucide");
  const candidate: IconSpec = {
    canvasSize: readNumber(params.get("sz")) ?? defaults.canvasSize,
    background: readBackground(params, defaults.background),
    icon: {
      type: library.success ? library.data : "lucide",
      name: params.get("i") ?? "bell",
    },
    iconColor: readColor(params.get("ic")) ?? defaults.iconColor,
    iconScale: (readNumber(params.get("sc")) ?? defaults.iconScale * PERCENT) / PERCENT,
    offsetX: readNumber(params.get("x")) ?? 0,
    offsetY: readNumber(params.get("y")) ?? 0,
    rotation: readNumber(params.get("ro")) ?? 0,
    strokeWidth: readNumber(params.get("sw")) ?? defaults.strokeWidth,
    noise: (readNumber(params.get("n")) ?? 0) / PERCENT,
  };
  const parsed = iconSpecSchema.safeParse(candidate);
  return parsed.success ? parsed.data : defaults;
}
