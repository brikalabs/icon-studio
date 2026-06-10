import { z } from "zod";
import { serializeAttributes } from "./xml";

export const iconNodeSchema = z.array(
  z.tuple([z.string(), z.record(z.string(), z.union([z.string(), z.number()]))]),
);

/** An icon as data: a flat list of [tag, attributes] SVG primitives on a 24x24 grid. */
export type IconNode = z.infer<typeof iconNodeSchema>;

/** The 24x24 grid every bundled icon library is drawn on. */
export const LUCIDE_GRID = 24;

/** Serializes an IconNode to SVG markup (geometry only, styling comes from the parent group). */
export function serializeIconNode(node: IconNode): string {
  return node.map(([tag, attributes]) => `<${tag}${serializeAttributes(attributes)}/>`).join("");
}
