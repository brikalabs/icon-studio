import { z } from "zod";
import type { IconNode } from "./icon-node";
import { getIconifyCachedNames, getIconifyIcon } from "./iconify";
import { getLucideIconNode, getLucideIconTags, lucideIconNames } from "./lucide";
import type { IconLibraryId } from "./types";

/**
 * How a glyph is painted: stroked outlines on the 24 grid (lucide),
 * filled paths (brands), or raw Iconify body markup with its own grid.
 */
export type GlyphKind = "stroke" | "fill" | "body";

export type IconGlyph =
  | { readonly kind: "stroke" | "fill"; readonly node: IconNode }
  | {
      readonly kind: "body";
      readonly body: string;
      readonly width: number;
      readonly height: number;
    };

export interface IconLibraryInfo {
  readonly id: IconLibraryId;
  readonly label: string;
}

/**
 * The searchable icon libraries, in display order. Other popular sets
 * (Tabler, Heroicons, Material, ...) live inside "All": the full Iconify
 * catalogue with its per-set browser.
 */
export const iconLibraries: readonly IconLibraryInfo[] = [
  { id: "lucide", label: "Lucide" },
  { id: "brand", label: "Brands" },
  { id: "iconify", label: "All" },
];

interface LibraryState {
  readonly names: () => readonly string[];
  readonly get: (name: string) => IconGlyph | undefined;
  readonly terms: (name: string) => readonly string[];
}

function nodeState(
  kind: "stroke" | "fill",
  names: () => readonly string[],
  get: (name: string) => IconNode | undefined,
  terms: (name: string) => readonly string[],
): LibraryState {
  return {
    names,
    get: (name) => {
      const node = get(name);
      return node ? { kind, node } : undefined;
    },
    terms,
  };
}

const brandIconSchema = z.object({
  title: z.string(),
  slug: z.string().min(1),
  /** Single 24x24 fill path. */
  path: z.string().min(1),
});

function brandState(module: object): LibraryState {
  const icons = new Map<string, { node: IconNode; title: string }>();
  for (const candidate of Object.values(module)) {
    const parsed = brandIconSchema.safeParse(candidate);
    if (parsed.success) {
      icons.set(parsed.data.slug, {
        node: [["path", { d: parsed.data.path }]],
        title: parsed.data.title,
      });
    }
  }
  const names = [...icons.keys()].sort((a, b) => a.localeCompare(b));
  return nodeState(
    "fill",
    () => names,
    (name) => icons.get(name)?.node,
    (name) => {
      const title = icons.get(name)?.title;
      return title ? [title.toLowerCase()] : [];
    },
  );
}

const states = new Map<IconLibraryId, LibraryState>([
  ["lucide", nodeState("stroke", () => lucideIconNames, getLucideIconNode, getLucideIconTags)],
  [
    // The Iconify "library" is the unbounded remote catalogue: its names are
    // whatever ensureIconifyIcons has cached so far (see iconify.ts).
    "iconify",
    {
      names: getIconifyCachedNames,
      get: (name) => {
        const glyph = getIconifyIcon(name);
        return glyph ? { kind: "body", ...glyph } : undefined;
      },
      terms: () => [],
    },
  ],
]);
const pending = new Map<IconLibraryId, Promise<void>>();

const loaders: Record<Exclude<IconLibraryId, "lucide" | "iconify">, () => Promise<LibraryState>> = {
  brand: async () => brandState(await import("simple-icons")),
};

/**
 * Loads a lazy icon catalogue. The catalogues are multi-megabyte modules,
 * so everything except lucide stays out of the initial bundle; bundlers
 * split each dynamic import into its own chunk. Idempotent and coalescing.
 */
export function ensureIconLibrary(id: IconLibraryId): Promise<void> {
  if (id === "lucide" || id === "iconify" || states.has(id)) {
    return Promise.resolve();
  }
  const inFlight = pending.get(id);
  if (inFlight) {
    return inFlight;
  }
  const load = loaders[id]().then((state) => {
    states.set(id, state);
    pending.delete(id);
  });
  pending.set(id, load);
  return load;
}

export function isIconLibraryReady(id: IconLibraryId): boolean {
  return states.has(id);
}

/** Empty until {@link ensureIconLibrary} has resolved for lazy libraries. */
export function getIconNames(id: IconLibraryId): readonly string[] {
  return states.get(id)?.names() ?? [];
}

export function getIconGlyph(id: IconLibraryId, name: string): IconGlyph | undefined {
  return states.get(id)?.get(name);
}

/** Search keywords beyond the icon name (lucide tags, brand titles). */
export function getIconTerms(id: IconLibraryId, name: string): readonly string[] {
  return states.get(id)?.terms(name) ?? [];
}
