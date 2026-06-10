import { embedCustomSvg, sanitizeSvgContent } from "./custom-svg";
import { LUCIDE_GRID, serializeIconNode } from "./icon-node";
import { getIconGlyph } from "./libraries";
import {
  type Background,
  type GradientStop,
  type IconSpec,
  type IconSpecInput,
  iconSpecSchema,
} from "./types";
import { escapeXml, formatNumber, serializeAttributes } from "./xml";

const GRADIENT_ID = "icon-studio-bg";
const NOISE_ID = "icon-studio-noise";
const GLARE_ID = "icon-studio-glare";

const FONT_STACKS: Readonly<Record<"sans" | "serif" | "mono", string>> = {
  sans: "'Inter', system-ui, -apple-system, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
};

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Linear gradient endpoints for a CSS-convention angle (0 = up, 90 = right),
 * expressed in objectBoundingBox coordinates centered on the canvas.
 */
export function linearGradientEndpoints(angle: number): {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
} {
  const dx = Math.sin(toRadians(angle));
  const dy = -Math.cos(toRadians(angle));
  return {
    x1: 0.5 - dx / 2,
    y1: 0.5 - dy / 2,
    x2: 0.5 + dx / 2,
    y2: 0.5 + dy / 2,
  };
}

function renderStops(stops: readonly GradientStop[]): string {
  return [...stops]
    .sort((a, b) => a.offset - b.offset)
    .map((stop) => `<stop offset="${formatNumber(stop.offset)}" stop-color="${stop.color}"/>`)
    .join("");
}

function renderGradientDef(background: Background): string {
  if (background.type === "linear") {
    const { x1, y1, x2, y2 } = linearGradientEndpoints(background.angle);
    const attributes = serializeAttributes({
      id: GRADIENT_ID,
      x1: formatNumber(x1),
      y1: formatNumber(y1),
      x2: formatNumber(x2),
      y2: formatNumber(y2),
    });
    return `<linearGradient${attributes}>${renderStops(background.stops)}</linearGradient>`;
  }
  if (background.type === "radial") {
    const attributes = serializeAttributes({
      id: GRADIENT_ID,
      cx: formatNumber(background.cx),
      cy: formatNumber(background.cy),
      r: formatNumber(background.radius),
    });
    return `<radialGradient${attributes}>${renderStops(background.stops)}</radialGradient>`;
  }
  return "";
}

/**
 * Film-grain: monochrome fractal turbulence blended over the whole artwork,
 * icon included. `mix-blend-mode` keeps mid-grays neutral; renderers that
 * ignore it still show plausible grain because the rect's opacity stays low.
 * `noiseScale` divides the turbulence frequency: bigger means coarser grain.
 */
function renderNoise(spec: IconSpec, size: number): { def: string; layer: string } {
  if (spec.noise <= 0) {
    return { def: "", layer: "" };
  }
  const frequency = formatNumber(0.65 / spec.noiseScale);
  const def =
    `<filter id="${NOISE_ID}" x="0" y="0" width="100%" height="100%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="3" stitchTiles="stitch"/>` +
    `<feColorMatrix type="saturate" values="0"/>` +
    `</filter>`;
  const layer =
    `<rect width="${size}" height="${size}" filter="url(#${NOISE_ID})"` +
    ` opacity="${formatNumber(spec.noise * 0.5)}" style="mix-blend-mode:overlay"/>`;
  return { def, layer };
}

/** Glossy sheen: a white radial fade anchored near the top-left corner. */
function renderGlare(glare: number, size: number): { def: string; layer: string } {
  if (glare <= 0) {
    return { def: "", layer: "" };
  }
  const def =
    `<radialGradient id="${GLARE_ID}" cx="0.28" cy="0.22" r="0.85">` +
    `<stop offset="0" stop-color="#FFFFFF" stop-opacity="${formatNumber(0.55 * glare)}"/>` +
    `<stop offset="0.55" stop-color="#FFFFFF" stop-opacity="${formatNumber(0.12 * glare)}"/>` +
    `<stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>` +
    `</radialGradient>`;
  const layer = `<rect width="${size}" height="${size}" fill="url(#${GLARE_ID})"/>`;
  return { def, layer };
}

function backgroundFill(background: Background): string {
  return background.type === "solid" ? background.color : `url(#${GRADIENT_ID})`;
}

interface IconBox {
  readonly x: number;
  readonly y: number;
  readonly size: number;
}

function iconBox(spec: IconSpec): IconBox {
  const size = spec.canvasSize * spec.iconScale;
  return {
    x: (spec.canvasSize - size) / 2 + spec.offsetX,
    y: (spec.canvasSize - size) / 2 + spec.offsetY,
    size,
  };
}

/** translate + scale + rotate-about-grid-center, applied right to left. */
function gridTransform(
  box: IconBox,
  rotation: number,
  gridWidth = LUCIDE_GRID,
  gridHeight = LUCIDE_GRID,
): string {
  const scale = box.size / Math.max(gridWidth, gridHeight);
  // Center non-square grids inside the square icon box.
  const x = box.x + (box.size - gridWidth * scale) / 2;
  const y = box.y + (box.size - gridHeight * scale) / 2;
  const parts = [
    `translate(${formatNumber(x)} ${formatNumber(y)})`,
    `scale(${formatNumber(scale)})`,
  ];
  if (rotation !== 0) {
    parts.push(
      `rotate(${formatNumber(rotation)} ${formatNumber(gridWidth / 2)} ${formatNumber(gridHeight / 2)})`,
    );
  }
  return parts.join(" ");
}

function renderIconLayer(spec: IconSpec): string {
  const box = iconBox(spec);

  if (spec.icon.type === "text") {
    const { text, fontFamily, fontWeight } = spec.icon;
    // Monogram sizing: one glyph nearly fills the box, longer text shrinks.
    const fontSize = Math.min(box.size * 0.82, (box.size * 1.18) / text.length ** 0.85);
    const cx = box.x + box.size / 2;
    const cy = box.y + box.size / 2;
    const attributes = serializeAttributes({
      x: formatNumber(cx),
      y: formatNumber(cy),
      "text-anchor": "middle",
      "dominant-baseline": "central",
      "font-family": FONT_STACKS[fontFamily],
      "font-size": formatNumber(fontSize),
      "font-weight": fontWeight,
      "letter-spacing": "-0.02em",
      fill: spec.iconColor,
      ...(spec.rotation === 0
        ? {}
        : {
            transform: `rotate(${formatNumber(spec.rotation)} ${formatNumber(cx)} ${formatNumber(cy)})`,
          }),
    });
    return `<text${attributes}>${escapeXml(text)}</text>`;
  }

  if (spec.icon.type === "custom") {
    const embedded = embedCustomSvg(spec.icon.svg, box, spec.iconColor);
    if (spec.rotation === 0) {
      return embedded;
    }
    const cx = box.x + box.size / 2;
    const cy = box.y + box.size / 2;
    return `<g transform="rotate(${formatNumber(spec.rotation)} ${formatNumber(cx)} ${formatNumber(cy)})">${embedded}</g>`;
  }

  const glyph = getIconGlyph(spec.icon.type, spec.icon.name);
  if (!glyph) {
    throw new Error(`unknown ${spec.icon.type} icon "${spec.icon.name}"`);
  }

  if (glyph.kind === "body") {
    // Iconify bodies carry their own grid and reference currentColor.
    const attributes = serializeAttributes({
      transform: gridTransform(box, spec.rotation, glyph.width, glyph.height),
      color: spec.iconColor,
    });
    return `<g${attributes}>${sanitizeSvgContent(glyph.body)}</g>`;
  }

  const transform = gridTransform(box, spec.rotation);
  const attributes =
    glyph.kind === "fill"
      ? serializeAttributes({ transform, fill: spec.iconColor })
      : serializeAttributes({
          transform,
          fill: "none",
          stroke: spec.iconColor,
          "stroke-width": formatNumber(spec.strokeWidth),
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
        });
  return `<g${attributes}>${serializeIconNode(glyph.node)}</g>`;
}

/**
 * Composes the full square icon as a standalone SVG document: background
 * rect (solid or gradient), a centered icon layer with offset, scale, and
 * rotation applied, and an optional grain overlay on top of everything.
 */
export function buildIconSvg(input: IconSpecInput): string {
  const spec = iconSpecSchema.parse(input);
  const size = spec.canvasSize;

  const rootAttributes = serializeAttributes({
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
  });

  const gradientDef = renderGradientDef(spec.background);
  const noise = renderNoise(spec, size);
  const glare = renderGlare(spec.glare, size);
  const defContent = `${gradientDef}${glare.def}${noise.def}`;
  const defs = defContent ? `<defs>${defContent}</defs>` : "";
  const rect = `<rect width="${size}" height="${size}" fill="${backgroundFill(spec.background)}"/>`;

  return `<svg${rootAttributes}>${defs}${rect}${renderIconLayer(spec)}${glare.layer}${noise.layer}</svg>`;
}

/** Download/file name suggestion for a spec, e.g. "bell.svg" or "mdi-home.svg". */
export function suggestFileName(spec: Pick<IconSpec, "icon">): string {
  if (spec.icon.type === "custom") {
    return "icon.svg";
  }
  if (spec.icon.type === "text") {
    const slug = spec.icon.text.toLowerCase().replace(/[^a-z0-9]+/g, "");
    return `${slug === "" ? "monogram" : slug}.svg`;
  }
  // Iconify names carry a "prefix:" that filesystems (Windows) reject.
  return `${spec.icon.name.replace(/:/g, "-")}.svg`;
}
