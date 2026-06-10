import { serializeAttributes } from "./xml";

interface ParsedSvg {
  readonly attributes: Record<string, string>;
  readonly content: string;
}

const OPENING_TAG_PATTERN = /<svg\b([^>]*)>/i;
const ATTRIBUTE_PATTERN = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

function parseSvgDocument(svg: string): ParsedSvg {
  const openingTag = OPENING_TAG_PATTERN.exec(svg);
  if (!openingTag || typeof openingTag[1] !== "string") {
    throw new Error("custom icon is not an SVG document (missing <svg> root element)");
  }
  const closingIndex = svg.lastIndexOf("</svg>");
  if (closingIndex === -1) {
    throw new Error("custom icon is not an SVG document (missing </svg>)");
  }

  const attributes: Record<string, string> = {};
  for (const match of openingTag[1].matchAll(ATTRIBUTE_PATTERN)) {
    const name = match[1];
    const value = match[2] ?? match[3] ?? "";
    if (name) {
      attributes[name] = value;
    }
  }

  const contentStart = (openingTag.index ?? 0) + openingTag[0].length;
  return { attributes, content: svg.slice(contentStart, closingIndex) };
}

/**
 * Strips active content from a pasted SVG. The editor renders pasted markup
 * inline, so script elements, event handlers, and script URLs are removed.
 */
export function sanitizeSvgContent(content: string): string {
  return content
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<script\b[^>]*\/>/gi, "")
    .replace(/<foreignObject\b[\s\S]*?<\/foreignObject\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*')/gi, "")
    .replace(/((?:xlink:)?href\s*=\s*)(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '$1""');
}

/**
 * Re-roots a pasted SVG as a nested `<svg>` positioned on the icon canvas.
 * Original presentation attributes survive; geometry attributes are replaced
 * so the artwork scales into the requested box. `color` is set so artwork
 * using `currentColor` follows the configured icon color.
 */
export function embedCustomSvg(
  svg: string,
  box: { readonly x: number; readonly y: number; readonly size: number },
  iconColor: string,
): string {
  const { attributes, content } = parseSvgDocument(svg.trim());

  const width = attributes.width;
  const height = attributes.height;
  const viewBox =
    attributes.viewBox ??
    (width && height && /^\d+(?:\.\d+)?$/.test(width) && /^\d+(?:\.\d+)?$/.test(height)
      ? `0 0 ${width} ${height}`
      : "0 0 24 24");

  const preserved: Record<string, string> = {};
  for (const [name, value] of Object.entries(attributes)) {
    if (!["x", "y", "width", "height", "viewBox", "xmlns", "id", "class"].includes(name)) {
      preserved[name] = value;
    }
  }

  const rootAttributes = {
    ...preserved,
    x: box.x,
    y: box.y,
    width: box.size,
    height: box.size,
    viewBox,
    color: iconColor,
  };

  return `<svg${serializeAttributes(rootAttributes)}>${sanitizeSvgContent(content)}</svg>`;
}
