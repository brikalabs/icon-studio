import { embedCustomSvg } from "./custom-svg";
import { getLucideIconNode, LUCIDE_GRID, serializeIconNode } from "./lucide";
import { type Background, type IconSpec, type IconSpecInput, iconSpecSchema } from "./types";
import { formatNumber, serializeAttributes } from "./xml";

const GRADIENT_ID = "icon-studio-bg";

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

function renderGradientDefs(background: Background): string {
  if (background.type === "linear") {
    const { x1, y1, x2, y2 } = linearGradientEndpoints(background.angle);
    const attributes = serializeAttributes({
      id: GRADIENT_ID,
      x1: formatNumber(x1),
      y1: formatNumber(y1),
      x2: formatNumber(x2),
      y2: formatNumber(y2),
    });
    return (
      `<defs><linearGradient${attributes}>` +
      `<stop offset="0" stop-color="${background.from}"/>` +
      `<stop offset="1" stop-color="${background.to}"/>` +
      `</linearGradient></defs>`
    );
  }
  if (background.type === "radial") {
    return (
      `<defs><radialGradient id="${GRADIENT_ID}" cx="0.5" cy="0.5" r="0.7071">` +
      `<stop offset="0" stop-color="${background.from}"/>` +
      `<stop offset="1" stop-color="${background.to}"/>` +
      `</radialGradient></defs>`
    );
  }
  return "";
}

function backgroundFill(background: Background): string {
  return background.type === "solid" ? background.color : `url(#${GRADIENT_ID})`;
}

function renderIconLayer(spec: IconSpec): string {
  const iconSize = spec.canvasSize * spec.iconScale;
  const x = (spec.canvasSize - iconSize) / 2 + spec.offsetX;
  const y = (spec.canvasSize - iconSize) / 2 + spec.offsetY;

  if (spec.icon.type === "custom") {
    return embedCustomSvg(spec.icon.svg, { x, y, size: iconSize }, spec.iconColor);
  }

  const node = getLucideIconNode(spec.icon.name);
  if (!node) {
    throw new Error(`unknown lucide icon "${spec.icon.name}"`);
  }

  const scale = iconSize / LUCIDE_GRID;
  const attributes = serializeAttributes({
    transform: `translate(${formatNumber(x)} ${formatNumber(y)}) scale(${formatNumber(scale)})`,
    fill: "none",
    stroke: spec.iconColor,
    "stroke-width": formatNumber(spec.strokeWidth),
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
  return `<g${attributes}>${serializeIconNode(node)}</g>`;
}

/**
 * Composes the full square icon as a standalone SVG document:
 * background rect (solid or gradient) plus a centered, offsettable icon layer.
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
  const rect = `<rect width="${size}" height="${size}" fill="${backgroundFill(spec.background)}"/>`;

  return `<svg${rootAttributes}>${renderGradientDefs(spec.background)}${rect}${renderIconLayer(spec)}</svg>`;
}

/** Download/file name suggestion for a spec, e.g. "bell.svg". */
export function suggestFileName(spec: Pick<IconSpec, "icon">): string {
  return spec.icon.type === "lucide" ? `${spec.icon.name}.svg` : "icon.svg";
}
