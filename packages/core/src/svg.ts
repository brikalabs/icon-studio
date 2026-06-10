import { embedCustomSvg } from "./custom-svg";
import { LUCIDE_GRID, serializeIconNode } from "./icon-node";
import { getIconGlyph } from "./libraries";
import {
  type Background,
  type GradientStop,
  type IconSpec,
  type IconSpecInput,
  iconSpecSchema,
} from "./types";
import { formatNumber, serializeAttributes } from "./xml";

const GRADIENT_ID = "icon-studio-bg";
const NOISE_ID = "icon-studio-noise";

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
 */
function renderNoise(noise: number, size: number): { def: string; layer: string } {
  if (noise <= 0) {
    return { def: "", layer: "" };
  }
  const def =
    `<filter id="${NOISE_ID}" x="0" y="0" width="100%" height="100%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>` +
    `<feColorMatrix type="saturate" values="0"/>` +
    `</filter>`;
  const layer =
    `<rect width="${size}" height="${size}" filter="url(#${NOISE_ID})"` +
    ` opacity="${formatNumber(noise * 0.5)}" style="mix-blend-mode:overlay"/>`;
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
function gridTransform(box: IconBox, rotation: number): string {
  const scale = box.size / LUCIDE_GRID;
  const center = LUCIDE_GRID / 2;
  const parts = [
    `translate(${formatNumber(box.x)} ${formatNumber(box.y)})`,
    `scale(${formatNumber(scale)})`,
  ];
  if (rotation !== 0) {
    parts.push(`rotate(${formatNumber(rotation)} ${center} ${center})`);
  }
  return parts.join(" ");
}

function renderIconLayer(spec: IconSpec): string {
  const box = iconBox(spec);

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
  const noise = renderNoise(spec.noise, size);
  const defs = gradientDef || noise.def ? `<defs>${gradientDef}${noise.def}</defs>` : "";
  const rect = `<rect width="${size}" height="${size}" fill="${backgroundFill(spec.background)}"/>`;

  return `<svg${rootAttributes}>${defs}${rect}${renderIconLayer(spec)}${noise.layer}</svg>`;
}

/** Download/file name suggestion for a spec, e.g. "bell.svg". */
export function suggestFileName(spec: Pick<IconSpec, "icon">): string {
  return spec.icon.type === "custom" ? "icon.svg" : `${spec.icon.name}.svg`;
}
