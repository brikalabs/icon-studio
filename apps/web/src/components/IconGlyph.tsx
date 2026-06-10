import { getIconGlyph, type IconLibraryId, LUCIDE_GRID } from "@brika/icon-studio-core";
import { createElement } from "react";

interface IconGlyphProps {
  readonly library: IconLibraryId;
  readonly name: string;
  readonly size?: number;
}

/**
 * Renders a catalogue icon straight from its library data, so the picker
 * shows exactly the geometry the exporter will emit. IconNode attributes
 * are plain SVG attribute names, which React passes through on SVG elements.
 */
export function IconGlyph({ library, name, size = 20 }: Readonly<IconGlyphProps>) {
  const glyph = getIconGlyph(library, name);
  if (!glyph) {
    return null;
  }
  const filled = glyph.kind === "fill";
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${LUCIDE_GRID} ${LUCIDE_GRID}`}
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {glyph.node.map(([tag, attributes], index) =>
        createElement(tag, { ...attributes, key: `${name}-${index}` }),
      )}
    </svg>
  );
}
