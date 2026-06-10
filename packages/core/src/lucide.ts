/// <reference path="./lucide-data.d.ts" />
import iconNodesJson from "lucide-static/icon-nodes.json";
import tagsJson from "lucide-static/tags.json";
import { z } from "zod";
import { serializeAttributes } from "./xml";

const iconNodeSchema = z.array(
  z.tuple([z.string(), z.record(z.string(), z.union([z.string(), z.number()]))]),
);

/** A lucide icon as data: a flat list of [tag, attributes] SVG primitives on a 24x24 grid. */
export type IconNode = z.infer<typeof iconNodeSchema>;

const iconNodes = z.record(z.string(), iconNodeSchema).parse(iconNodesJson);
const iconTags = z.record(z.string(), z.array(z.string())).parse(tagsJson);

/** Canonical kebab-case lucide icon names, e.g. "bell", "axis-3d". */
export const lucideIconNames: readonly string[] = Object.keys(iconNodes);

export function getLucideIconNode(name: string): IconNode | undefined {
  return iconNodes[name];
}

/** Search tags per icon name, used for fuzzy lookup ("alarm" finds "bell"). */
export function getLucideIconTags(name: string): readonly string[] {
  return iconTags[name] ?? [];
}

/** The 24x24 grid lucide icons are drawn on. */
export const LUCIDE_GRID = 24;

/** Serializes an IconNode to SVG markup (geometry only, styling comes from the parent group). */
export function serializeIconNode(node: IconNode): string {
  return node.map(([tag, attributes]) => `<${tag}${serializeAttributes(attributes)}/>`).join("");
}
