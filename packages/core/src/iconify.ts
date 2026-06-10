import { z } from "zod";

/**
 * On-demand access to the whole Iconify universe (200+ icon sets, 200,000+
 * icons) through api.iconify.design. Icons are addressed as "prefix:name"
 * (e.g. "mdi:home") and fetched in per-prefix batches into a module cache,
 * so rendering stays synchronous after an ensure pass, the same
 * ensure-then-render contract the lazy bundled libraries use.
 */

export interface IconifyBodyGlyph {
  /** Inner SVG markup, colored via currentColor. */
  readonly body: string;
  readonly width: number;
  readonly height: number;
}

interface IconifyConfig {
  /** API base URL; point at a self-hosted Iconify API to drop the dependency on the public one. */
  api?: string;
  /** Fetch implementation override (tests, custom agents). */
  fetcher?: (url: string) => Promise<Response>;
}

let apiBase = "https://api.iconify.design";
let fetcher: (url: string) => Promise<Response> = (url) => fetch(url);

export function configureIconify(config: IconifyConfig): void {
  apiBase = config.api ?? apiBase;
  fetcher = config.fetcher ?? fetcher;
}

const iconifyDataSchema = z.object({
  prefix: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  icons: z.record(
    z.string(),
    z.object({
      body: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
    }),
  ),
});

const searchResponseSchema = z.object({ icons: z.array(z.string()) });

const DEFAULT_GRID = 16;

const cache = new Map<string, IconifyBodyGlyph>();
/** Names the API was asked about and did not return. */
const notFound = new Set<string>();
const pendingBatches = new Map<string, Promise<void>>();

export function getIconifyIcon(name: string): IconifyBodyGlyph | undefined {
  return cache.get(name);
}

/** All names fetched so far, newest knowledge of the unbounded catalogue. */
export function getIconifyCachedNames(): readonly string[] {
  return [...cache.keys()];
}

/** True once a fetch confirmed the API has no such icon. */
export function isIconifyIconMissing(name: string): boolean {
  return notFound.has(name);
}

function splitName(name: string): { prefix: string; icon: string } | undefined {
  const at = name.indexOf(":");
  if (at <= 0 || at === name.length - 1) {
    return undefined;
  }
  return { prefix: name.slice(0, at), icon: name.slice(at + 1) };
}

async function fetchBatch(prefix: string, icons: readonly string[]): Promise<void> {
  const url = `${apiBase}/${prefix}.json?icons=${encodeURIComponent(icons.join(","))}`;
  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`Iconify API responded ${response.status} for ${prefix}`);
  }
  const data = iconifyDataSchema.parse(await response.json());
  for (const icon of icons) {
    const entry = data.icons[icon];
    const full = `${prefix}:${icon}`;
    if (entry) {
      cache.set(full, {
        body: entry.body,
        width: entry.width ?? data.width ?? DEFAULT_GRID,
        height: entry.height ?? data.height ?? DEFAULT_GRID,
      });
    } else {
      notFound.add(full);
    }
  }
}

/**
 * Fetches any not-yet-cached icons, batched per prefix. Resolves once every
 * requested name is either cached or confirmed missing. Concurrent calls for
 * the same prefix batch share one request.
 */
export async function ensureIconifyIcons(names: readonly string[]): Promise<void> {
  const byPrefix = new Map<string, string[]>();
  for (const name of names) {
    if (cache.has(name) || notFound.has(name)) {
      continue;
    }
    const parts = splitName(name);
    if (!parts) {
      notFound.add(name);
      continue;
    }
    const queue = byPrefix.get(parts.prefix) ?? [];
    queue.push(parts.icon);
    byPrefix.set(parts.prefix, queue);
  }

  const batches: Promise<void>[] = [];
  for (const [prefix, icons] of byPrefix) {
    const key = `${prefix}?${[...icons].sort((a, b) => a.localeCompare(b)).join(",")}`;
    const existing = pendingBatches.get(key);
    if (existing) {
      batches.push(existing);
      continue;
    }
    const batch = fetchBatch(prefix, icons).finally(() => pendingBatches.delete(key));
    pendingBatches.set(key, batch);
    batches.push(batch);
  }
  await Promise.all(batches);
}

/** Full-text search across every Iconify set. Returns "prefix:name" entries. */
export async function searchIconifyIcons(query: string, limit = 96): Promise<string[]> {
  const trimmed = query.trim();
  if (trimmed === "") {
    return [];
  }
  const url = `${apiBase}/search?query=${encodeURIComponent(trimmed)}&limit=${limit}`;
  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`Iconify search responded ${response.status}`);
  }
  return searchResponseSchema.parse(await response.json()).icons;
}
