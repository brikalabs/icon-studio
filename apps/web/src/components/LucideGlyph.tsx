import { getLucideIconNode, LUCIDE_GRID } from "@brika/icon-studio-core";
import { createElement } from "react";

interface LucideGlyphProps {
  readonly name: string;
  readonly size?: number;
}

/**
 * Renders a lucide IconNode straight from the catalogue data, so the picker
 * shows exactly the geometry the exporter will emit. Attributes in the data
 * are plain SVG attribute names, which React passes through on SVG elements.
 */
export function LucideGlyph({ name, size = 20 }: Readonly<LucideGlyphProps>) {
  const node = getLucideIconNode(name);
  if (!node) {
    return null;
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${LUCIDE_GRID} ${LUCIDE_GRID}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {node.map(([tag, attributes], index) =>
        createElement(tag, { ...attributes, key: `${name}-${index}` }),
      )}
    </svg>
  );
}
