import {
  type Background,
  createDefaultIconSpec,
  hexColorSchema,
  type IconSpec,
  iconSpecSchema,
} from "./types";

/**
 * Shareable-URL codec. Lucide-based specs round-trip losslessly; pasted
 * custom SVGs are deliberately not serialized (they would not fit in a URL),
 * so decoding a custom-icon link falls back to the default icon.
 */

function writeColor(params: URLSearchParams, key: string, color: string): void {
  params.set(key, color.replace(/^#/, ""));
}

function readColor(params: URLSearchParams, key: string): string | undefined {
  const raw = params.get(key);
  if (raw === null) {
    return undefined;
  }
  const parsed = hexColorSchema.safeParse(`#${raw}`);
  return parsed.success ? parsed.data : undefined;
}

function readNumber(params: URLSearchParams, key: string): number | undefined {
  const raw = params.get(key);
  if (raw === null) {
    return undefined;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

export function specToSearchParams(spec: IconSpec): URLSearchParams {
  const params = new URLSearchParams();
  if (spec.icon.type === "lucide") {
    params.set("icon", spec.icon.name);
  }
  params.set("size", String(spec.canvasSize));
  params.set("bg", spec.background.type);
  if (spec.background.type === "solid") {
    writeColor(params, "c", spec.background.color);
  } else {
    writeColor(params, "from", spec.background.from);
    writeColor(params, "to", spec.background.to);
    if (spec.background.type === "linear") {
      params.set("angle", String(spec.background.angle));
    }
  }
  writeColor(params, "ic", spec.iconColor);
  params.set("scale", String(spec.iconScale));
  params.set("x", String(spec.offsetX));
  params.set("y", String(spec.offsetY));
  params.set("sw", String(spec.strokeWidth));
  return params;
}

function readBackground(params: URLSearchParams, fallback: Background): Background {
  const type = params.get("bg");
  if (type === "solid") {
    const color = readColor(params, "c");
    return color ? { type: "solid", color } : fallback;
  }
  if (type === "linear" || type === "radial") {
    const from = readColor(params, "from");
    const to = readColor(params, "to");
    if (!from || !to) {
      return fallback;
    }
    if (type === "radial") {
      return { type: "radial", from, to };
    }
    return { type: "linear", from, to, angle: readNumber(params, "angle") ?? 45 };
  }
  return fallback;
}

/** Tolerant decode: anything missing or malformed falls back to defaults. */
export function specFromSearchParams(params: URLSearchParams): IconSpec {
  const defaults = createDefaultIconSpec();
  const candidate: IconSpec = {
    canvasSize: readNumber(params, "size") ?? defaults.canvasSize,
    background: readBackground(params, defaults.background),
    icon: { type: "lucide", name: params.get("icon") ?? "bell" },
    iconColor: readColor(params, "ic") ?? defaults.iconColor,
    iconScale: readNumber(params, "scale") ?? defaults.iconScale,
    offsetX: readNumber(params, "x") ?? defaults.offsetX,
    offsetY: readNumber(params, "y") ?? defaults.offsetY,
    strokeWidth: readNumber(params, "sw") ?? defaults.strokeWidth,
  };
  const parsed = iconSpecSchema.safeParse(candidate);
  return parsed.success ? parsed.data : defaults;
}
