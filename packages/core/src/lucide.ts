/// <reference path="./lucide-data.d.ts" />
import iconNodesJson from "lucide-static/icon-nodes.json";
import tagsJson from "lucide-static/tags.json";
import { z } from "zod";
import { type IconNode, iconNodeSchema } from "./icon-node";

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
