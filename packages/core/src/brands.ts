import { z } from "zod";

const brandIconSchema = z.object({
  title: z.string(),
  slug: z.string().min(1),
  /** Single 24x24 fill path. */
  path: z.string().min(1),
  /** Official brand color, without the leading '#'. */
  hex: z.string(),
});

export type BrandIcon = z.infer<typeof brandIconSchema>;

let catalogue: Map<string, BrandIcon> | null = null;
let names: readonly string[] = [];

/**
 * Loads the simple-icons catalogue on demand. The package is multiple
 * megabytes, so it stays out of the initial bundle; bundlers split this
 * dynamic import into its own chunk. Idempotent.
 */
export async function ensureBrandIcons(): Promise<void> {
  if (catalogue) {
    return;
  }
  const simpleIcons = await import("simple-icons");
  const map = new Map<string, BrandIcon>();
  for (const candidate of Object.values(simpleIcons)) {
    const parsed = brandIconSchema.safeParse(candidate);
    if (parsed.success) {
      map.set(parsed.data.slug, parsed.data);
    }
  }
  catalogue = map;
  names = [...map.keys()].sort((a, b) => a.localeCompare(b));
}

/** Simple-icons brand slugs, e.g. "github", "spotify". Empty until {@link ensureBrandIcons} resolves. */
export function getBrandIconNames(): readonly string[] {
  return names;
}

export function getBrandIcon(slug: string): BrandIcon | undefined {
  return catalogue?.get(slug);
}
