#!/usr/bin/env bun
/**
 * Vendors icon-library data into packages/core/src/data/.
 *
 * Tabler and Heroicons publish exports maps that block importing their
 * catalogue files directly, so this script normalizes them into the same
 * IconNode shape lucide uses and commits the result. Re-run after bumping
 * `@tabler/icons` or `heroicons` in the root devDependencies:
 *
 *   bun run sync:icons
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const ROOT = join(import.meta.dir, "..");
const OUT_DIR = join(ROOT, "packages/core/src/data");

const iconNodeSchema = z.array(
  z.tuple([z.string(), z.record(z.string(), z.union([z.string(), z.number()]))]),
);

interface Catalogue {
  icons: Record<string, z.infer<typeof iconNodeSchema>>;
  terms: Record<string, string[]>;
}

function writeCatalogue(name: string, catalogue: Catalogue): void {
  writeFileSync(join(OUT_DIR, `${name}.json`), JSON.stringify(catalogue));
  // allowArbitraryExtensions declaration: keeps tsc from inferring a
  // megabyte-sized literal type; zod validates the data at load time.
  writeFileSync(
    join(OUT_DIR, `${name}.d.json.ts`),
    "declare const data: unknown;\nexport default data;\n",
  );
  console.log(`${name}: ${Object.keys(catalogue.icons).length} icons`);
}

function syncTabler(): void {
  const dir = join(ROOT, "node_modules/@tabler/icons");
  const nodes = z
    .record(z.string(), iconNodeSchema)
    .parse(JSON.parse(readFileSync(join(dir, "tabler-nodes-outline.json"), "utf8")));
  const meta = z
    .record(
      z.string(),
      z.object({
        category: z.string().optional(),
        tags: z.array(z.union([z.string(), z.number(), z.null()])).optional(),
      }),
    )
    .parse(JSON.parse(readFileSync(join(dir, "icons.json"), "utf8")));

  const catalogue: Catalogue = { icons: {}, terms: {} };
  for (const [name, node] of Object.entries(nodes)) {
    catalogue.icons[name] = node;
    const entry = meta[name];
    const terms = (entry?.tags ?? [])
      .filter((tag) => tag !== null)
      .map((tag) => String(tag).toLowerCase());
    if (entry?.category) {
      terms.push(entry.category.toLowerCase());
    }
    if (terms.length > 0) {
      catalogue.terms[name] = terms;
    }
  }
  writeCatalogue("tabler", catalogue);
}

const PATH_TAG_PATTERN = /<path\b([^>]*?)\/?>/g;
const ATTRIBUTE_PATTERN = /([a-zA-Z-]+)\s*=\s*"([^"]*)"/g;
/** Geometry attributes worth keeping; stroke styling comes from the renderer. */
const KEPT_ATTRIBUTES = new Set(["d", "fill-rule", "clip-rule"]);

function syncHeroicons(): void {
  const dir = join(ROOT, "node_modules/heroicons/24/outline");
  const catalogue: Catalogue = { icons: {}, terms: {} };
  for (const file of readdirSync(dir).sort((a, b) => a.localeCompare(b))) {
    if (!file.endsWith(".svg")) {
      continue;
    }
    const svg = readFileSync(join(dir, file), "utf8");
    const node: [string, Record<string, string>][] = [];
    for (const pathTag of svg.matchAll(PATH_TAG_PATTERN)) {
      const attributes: Record<string, string> = {};
      for (const attribute of (pathTag[1] ?? "").matchAll(ATTRIBUTE_PATTERN)) {
        const [, key, value] = attribute;
        if (key && value !== undefined && KEPT_ATTRIBUTES.has(key)) {
          attributes[key] = value;
        }
      }
      if (attributes.d) {
        node.push(["path", attributes]);
      }
    }
    if (node.length > 0) {
      catalogue.icons[file.replace(/\.svg$/, "")] = node;
    }
  }
  writeCatalogue("heroicons", catalogue);
}

syncTabler();
syncHeroicons();
