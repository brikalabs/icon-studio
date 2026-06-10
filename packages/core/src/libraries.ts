import { z } from "zod";
import { type IconNode, iconNodeSchema } from "./icon-node";
import { getLucideIconNode, getLucideIconTags, lucideIconNames } from "./lucide";
import type { IconLibraryId } from "./types";

/** How a glyph is painted: stroked outlines (lucide, tabler, hero) or filled paths (brands). */
export type GlyphKind = "stroke" | "fill";

export interface IconGlyph {
  readonly kind: GlyphKind;
  readonly node: IconNode;
}

export interface IconLibraryInfo {
  readonly id: IconLibraryId;
  readonly label: string;
}

/** The searchable icon libraries, in display order. */
export const iconLibraries: readonly IconLibraryInfo[] = [
  { id: "lucide", label: "Lucide" },
  { id: "tabler", label: "Tabler" },
  { id: "hero", label: "Hero" },
  { id: "brand", label: "Brands" },
];

interface LibraryState {
  readonly kind: GlyphKind;
  readonly names: readonly string[];
  readonly get: (name: string) => IconNode | undefined;
  readonly terms: (name: string) => readonly string[];
}

const catalogueSchema = z.object({
  icons: z.record(z.string(), iconNodeSchema),
  terms: z.record(z.string(), z.array(z.string())),
});

/** Vendored catalogues (see scripts/sync-icon-data.ts). */
function catalogueState(kind: GlyphKind, data: unknown): LibraryState {
  const catalogue = catalogueSchema.parse(data);
  return {
    kind,
    names: Object.keys(catalogue.icons),
    get: (name) => catalogue.icons[name],
    terms: (name) => catalogue.terms[name] ?? [],
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
  return {
    kind: "fill",
    names: [...icons.keys()].sort((a, b) => a.localeCompare(b)),
    get: (name) => icons.get(name)?.node,
    terms: (name) => {
      const title = icons.get(name)?.title;
      return title ? [title.toLowerCase()] : [];
    },
  };
}

const states = new Map<IconLibraryId, LibraryState>([
  [
    "lucide",
    { kind: "stroke", names: lucideIconNames, get: getLucideIconNode, terms: getLucideIconTags },
  ],
]);
const pending = new Map<IconLibraryId, Promise<void>>();

const loaders: Record<Exclude<IconLibraryId, "lucide">, () => Promise<LibraryState>> = {
  tabler: async () => catalogueState("stroke", (await import("./data/tabler.json")).default),
  hero: async () => catalogueState("stroke", (await import("./data/heroicons.json")).default),
  brand: async () => brandState(await import("simple-icons")),
};

/**
 * Loads a lazy icon catalogue. The catalogues are multi-megabyte modules,
 * so everything except lucide stays out of the initial bundle; bundlers
 * split each dynamic import into its own chunk. Idempotent and coalescing.
 */
export function ensureIconLibrary(id: IconLibraryId): Promise<void> {
  if (id === "lucide" || states.has(id)) {
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
  return states.get(id)?.names ?? [];
}

export function getIconGlyph(id: IconLibraryId, name: string): IconGlyph | undefined {
  const state = states.get(id);
  const node = state?.get(name);
  return state && node ? { kind: state.kind, node } : undefined;
}

/** Search keywords beyond the icon name (lucide tags, tabler tags, brand titles). */
export function getIconTerms(id: IconLibraryId, name: string): readonly string[] {
  return states.get(id)?.terms(name) ?? [];
}
