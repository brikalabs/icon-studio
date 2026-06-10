import { parseArgs } from "node:util";
import {
  type Background,
  COVER_RADIUS,
  createDefaultIconSpec,
  type GradientStop,
  getBackgroundPreset,
  hexColorSchema,
  type IconLibraryId,
  type IconSource,
  type IconSpec,
  iconLibraryIdSchema,
  iconSpecSchema,
  suggestFileName,
  textFontFamilySchema,
  textFontWeightSchema,
} from "@brika/icon-studio-core";

export interface CliCommand {
  readonly kind: "generate" | "help" | "list-presets" | "search";
  readonly spec: IconSpec;
  readonly outFile: string;
  readonly query: string;
  readonly library: IconLibraryId;
}

export const HELP_TEXT = `brika-icon, generate square SVG icons for Brika plugins

Usage
  brika-icon <icon-name> [options]
  brika-icon --custom <file.svg> [options]
  brika-icon --search <query> [--lib brand]
  brika-icon --list-presets

Options
  -o, --out <file>        output path (default: <icon>.svg)
  -s, --size <px>         canvas edge in pixels (default: 512)
      --lib <id>          icon library: lucide (default), brand (simple-icons),
                          or iconify (any Iconify icon as "prefix:name", needs network)
  -p, --preset <id>       background preset (see --list-presets)
      --bg <color>        solid background color, e.g. "#18181B"
      --from <color>      gradient start color (with --to)
      --to <color>        gradient end color (with --from)
      --stops <list>      multi-stop gradient: "3F5EFB-FC466B" or "000000_0-FF0000_25-FFFFFF_100"
      --angle <deg>       linear gradient angle (default: 45)
      --radial            radial gradient instead of linear
      --icon-color <c>    icon color (default: #FFFFFF)
      --scale <0..1.5>    icon size as a fraction of the canvas (default: 0.55)
      --x <px>            horizontal icon offset from center (use --x=-10 for negatives)
      --y <px>            vertical icon offset from center (use --y=-10 for negatives)
      --rotate <deg>      icon rotation around its center (default: 0)
      --stroke <width>    lucide stroke width (default: 2)
      --noise <0..1>      film-grain overlay strength (default: 0)
      --noise-scale <x>   grain size multiplier, 0.1 fine to 3 coarse (default: 1)
      --glare <0..1>      glossy radial highlight strength (default: 0)
      --text <chars>      render a 1-4 character monogram instead of an icon
      --font <id>         monogram font: sans (default), serif, or mono
      --weight <w>        monogram weight: 400, 500, 600, 700 (default), or 800
      --custom <file>     embed a custom SVG file instead of a library icon
  -h, --help              show this help

Examples
  brika-icon bell --preset sunset -o assets/icon.svg
  brika-icon rocket --stops "3F5EFB-FC466B" --angle 45 --rotate 15 --noise 0.2
  brika-icon github --lib brand --bg "#18181B"
  brika-icon mdi:rocket-launch --lib iconify --preset ocean
  brika-icon tabler:bolt --lib iconify --preset midnight
  brika-icon --text BR --font mono --preset midnight --glare 0.4
  brika-icon --search alarm --lib iconify
`;

function parseColor(flag: string, value: string): string {
  const parsed = hexColorSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`--${flag} expects a hex color like #3F5EFB, got "${value}"`);
  }
  return parsed.data;
}

function parseNumberFlag(flag: string, value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`--${flag} expects a number, got "${value}"`);
  }
  return parsed;
}

/** Same packed format as share URLs: "RRGGBB-RRGGBB" or "RRGGBB_0-RRGGBB_100". */
function parseStops(raw: string): GradientStop[] {
  const parts = raw.split("-");
  if (parts.length < 2) {
    throw new Error(`--stops expects at least two colors, e.g. "3F5EFB-FC466B"`);
  }
  return parts.map((part, index) => {
    const [hex, offset] = part.split("_");
    return {
      color: parseColor("stops", `#${hex}`),
      offset:
        offset === undefined
          ? index / (parts.length - 1)
          : parseNumberFlag("stops", offset, 0) / 100,
    };
  });
}

interface BackgroundFlags {
  readonly preset?: string;
  readonly bg?: string;
  readonly from?: string;
  readonly to?: string;
  readonly stops?: string;
  readonly angle?: string;
  readonly radial: boolean;
}

function resolveBackground(flags: BackgroundFlags, fallback: Background): Background {
  if (flags.preset !== undefined) {
    const preset = getBackgroundPreset(flags.preset);
    if (!preset) {
      throw new Error(`unknown preset "${flags.preset}" (see --list-presets)`);
    }
    return preset.background;
  }
  if (flags.bg !== undefined) {
    return { type: "solid", color: parseColor("bg", flags.bg) };
  }

  let stops: GradientStop[] | undefined;
  if (flags.stops !== undefined) {
    stops = parseStops(flags.stops);
  } else if (flags.from !== undefined || flags.to !== undefined) {
    if (flags.from === undefined || flags.to === undefined) {
      throw new Error("--from and --to must be used together");
    }
    stops = [
      { color: parseColor("from", flags.from), offset: 0 },
      { color: parseColor("to", flags.to), offset: 1 },
    ];
  }
  if (stops === undefined) {
    return fallback;
  }
  if (flags.radial) {
    return { type: "radial", stops, cx: 0.5, cy: 0.5, radius: COVER_RADIUS };
  }
  return { type: "linear", stops, angle: parseNumberFlag("angle", flags.angle, 45) };
}

/** Parses argv (without the runtime prefix) into an executable command. */
export function parseCliArgs(
  argv: readonly string[],
  readFile: (path: string) => string,
): CliCommand {
  const { values, positionals } = parseArgs({
    args: [...argv],
    allowPositionals: true,
    options: {
      out: { type: "string", short: "o" },
      size: { type: "string", short: "s" },
      lib: { type: "string", default: "lucide" },
      preset: { type: "string", short: "p" },
      bg: { type: "string" },
      from: { type: "string" },
      to: { type: "string" },
      stops: { type: "string" },
      angle: { type: "string" },
      radial: { type: "boolean", default: false },
      "icon-color": { type: "string" },
      scale: { type: "string" },
      x: { type: "string" },
      y: { type: "string" },
      rotate: { type: "string" },
      stroke: { type: "string" },
      noise: { type: "string" },
      "noise-scale": { type: "string" },
      glare: { type: "string" },
      text: { type: "string" },
      font: { type: "string", default: "sans" },
      weight: { type: "string", default: "700" },
      custom: { type: "string" },
      search: { type: "string" },
      "list-presets": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  const library = iconLibraryIdSchema.safeParse(values.lib);
  if (!library.success) {
    throw new Error(`--lib expects one of lucide, brand, iconify; got "${values.lib}"`);
  }
  const defaults = createDefaultIconSpec();
  const base: CliCommand = {
    kind: "generate",
    spec: defaults,
    outFile: "",
    query: values.search ?? "",
    library: library.data,
  };

  if (values.help) {
    return { ...base, kind: "help" };
  }
  if (values["list-presets"]) {
    return { ...base, kind: "list-presets" };
  }
  if (values.search !== undefined) {
    return { ...base, kind: "search" };
  }

  const iconName = positionals[0];
  if (iconName === undefined && values.custom === undefined && values.text === undefined) {
    throw new Error("missing icon name (try `brika-icon bell` or `brika-icon --help`)");
  }

  const icon = ((): IconSource => {
    if (values.custom !== undefined) {
      return { type: "custom", svg: readFile(values.custom) };
    }
    if (values.text !== undefined) {
      const family = textFontFamilySchema.safeParse(values.font);
      if (!family.success) {
        throw new Error(`--font expects sans, serif, or mono; got "${values.font}"`);
      }
      const weight = textFontWeightSchema.safeParse(values.weight);
      if (!weight.success) {
        throw new Error(`--weight expects 400, 500, 600, 700, or 800; got "${values.weight}"`);
      }
      return { type: "text", text: values.text, fontFamily: family.data, fontWeight: weight.data };
    }
    return { type: library.data, name: iconName ?? "bell" };
  })();

  const spec = iconSpecSchema.parse({
    canvasSize: parseNumberFlag("size", values.size, defaults.canvasSize),
    background: resolveBackground(values, defaults.background),
    icon,
    iconColor:
      values["icon-color"] === undefined
        ? defaults.iconColor
        : parseColor("icon-color", values["icon-color"]),
    iconScale: parseNumberFlag("scale", values.scale, defaults.iconScale),
    offsetX: parseNumberFlag("x", values.x, 0),
    offsetY: parseNumberFlag("y", values.y, 0),
    rotation: parseNumberFlag("rotate", values.rotate, 0),
    strokeWidth: parseNumberFlag("stroke", values.stroke, defaults.strokeWidth),
    noise: parseNumberFlag("noise", values.noise, 0),
    noiseScale: parseNumberFlag("noise-scale", values["noise-scale"], 1),
    glare: parseNumberFlag("glare", values.glare, 0),
  });

  return { ...base, spec, outFile: values.out ?? suggestFileName(spec) };
}
