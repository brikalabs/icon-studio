import {
  getBrandIcon,
  getLucideIconNode,
  type IconLibraryId,
  LUCIDE_GRID,
} from "@brika/icon-studio-core";
import { createElement } from "react";

interface IconGlyphProps {
  readonly library: IconLibraryId;
  readonly name: string;
  readonly size?: number;
}

/**
 * Renders a catalogue icon straight from its library data, so the picker
 * shows exactly the geometry the exporter will emit. Lucide nodes carry
 * plain SVG attribute names, which React passes through on SVG elements.
 */
export function IconGlyph({ library, name, size = 20 }: Readonly<IconGlyphProps>) {
  const isBrand = library === "brand";
  const children = isBrand
    ? renderBrandPath(name)
    : getLucideIconNode(name)?.map(([tag, attributes], index) =>
        createElement(tag, { ...attributes, key: `${name}-${index}` }),
      );
  if (!children) {
    return null;
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${LUCIDE_GRID} ${LUCIDE_GRID}`}
      fill={isBrand ? "currentColor" : "none"}
      stroke={isBrand ? "none" : "currentColor"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function renderBrandPath(name: string) {
  const brand = getBrandIcon(name);
  return brand ? <path d={brand.path} /> : undefined;
}
