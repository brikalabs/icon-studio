import { parseArgs } from "node:util";
import {
  type Background,
  createDefaultIconSpec,
  getBackgroundPreset,
  hexColorSchema,
  type IconSpec,
  iconSpecSchema,
  suggestFileName,
} from "@brika/icon-studio-core";

export interface CliCommand {
  readonly kind: "generate" | "help" | "list-presets" | "search";
  readonly spec: IconSpec;
  readonly outFile: string;
  readonly query: string;
}

export const HELP_TEXT = `brika-icon, generate square SVG icons for Brika plugins

Usage
  brika-icon <lucide-icon> [options]
  brika-icon --custom <file.svg> [options]
  brika-icon --search <query>
  brika-icon --list-presets

Options
  -o, --out <file>        output path (default: <icon>.svg)
  -s, --size <px>         canvas edge in pixels (default: 512)
  -p, --preset <id>       background preset (see --list-presets)
      --bg <color>        solid background color, e.g. "#18181B"
      --from <color>      gradient start color
      --to <color>        gradient end color
      --angle <deg>       linear gradient angle (default: 45)
      --radial            use a radial gradient instead of linear
      --icon-color <c>    icon color (default: #FFFFFF)
      --scale <0..1.5>    icon size as a fraction of the canvas (default: 0.55)
      --x <px>            horizontal icon offset from center (use --x=-10 for negatives)
      --y <px>            vertical icon offset from center (use --y=-10 for negatives)
      --stroke <width>    lucide stroke width (default: 2)
      --custom <file>     embed a custom SVG file instead of a lucide icon
  -h, --help              show this help

Examples
  brika-icon bell --preset sunset -o assets/icon.svg
  brika-icon rocket --from "#3F5EFB" --to "#FC466B" --angle 45 --scale 0.5
  brika-icon database --bg "#18181B" --icon-color "#38EF7D"
`;

function parseColor(flag: string, value: string): string {
  const parsed = hexColorSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`--${flag} expects a hex color like #3F5EFB, got "${value}"`);
  }
  return parsed.data;
}

function parseNumberFlag(flag: string, value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`--${flag} expects a number, got "${value}"`);
  }
  return parsed;
}

interface BackgroundFlags {
  readonly preset?: string;
  readonly bg?: string;
  readonly from?: string;
  readonly to?: string;
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
  if (flags.from !== undefined || flags.to !== undefined) {
    if (flags.from === undefined || flags.to === undefined) {
      throw new Error("--from and --to must be used together");
    }
    const from = parseColor("from", flags.from);
    const to = parseColor("to", flags.to);
    if (flags.radial) {
      return { type: "radial", from, to };
    }
    const angle = flags.angle === undefined ? 45 : parseNumberFlag("angle", flags.angle);
    return { type: "linear", from, to, angle };
  }
  return fallback;
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
      preset: { type: "string", short: "p" },
      bg: { type: "string" },
      from: { type: "string" },
      to: { type: "string" },
      angle: { type: "string" },
      radial: { type: "boolean", default: false },
      "icon-color": { type: "string" },
      scale: { type: "string" },
      x: { type: "string" },
      y: { type: "string" },
      stroke: { type: "string" },
      custom: { type: "string" },
      search: { type: "string" },
      "list-presets": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  const defaults = createDefaultIconSpec();
  const command: CliCommand = {
    kind: "generate",
    spec: defaults,
    outFile: "",
    query: values.search ?? "",
  };

  if (values.help) {
    return { ...command, kind: "help" };
  }
  if (values["list-presets"]) {
    return { ...command, kind: "list-presets" };
  }
  if (values.search !== undefined) {
    return { ...command, kind: "search" };
  }

  const iconName = positionals[0];
  if (iconName === undefined && values.custom === undefined) {
    throw new Error("missing icon name (try `brika-icon bell` or `brika-icon --help`)");
  }

  const spec = iconSpecSchema.parse({
    canvasSize:
      values.size === undefined ? defaults.canvasSize : parseNumberFlag("size", values.size),
    background: resolveBackground(values, defaults.background),
    icon:
      values.custom !== undefined
        ? { type: "custom", svg: readFile(values.custom) }
        : { type: "lucide", name: iconName ?? "bell" },
    iconColor:
      values["icon-color"] === undefined
        ? defaults.iconColor
        : parseColor("icon-color", values["icon-color"]),
    iconScale:
      values.scale === undefined ? defaults.iconScale : parseNumberFlag("scale", values.scale),
    offsetX: values.x === undefined ? defaults.offsetX : parseNumberFlag("x", values.x),
    offsetY: values.y === undefined ? defaults.offsetY : parseNumberFlag("y", values.y),
    strokeWidth:
      values.stroke === undefined ? defaults.strokeWidth : parseNumberFlag("stroke", values.stroke),
  });

  return {
    ...command,
    spec,
    outFile: values.out ?? suggestFileName(spec),
  };
}
