/**
 * Bundles the CLI into a single Node-compatible entrypoint under dist/.
 *
 * Everything the command needs at runtime is inlined: the core engine, zod,
 * and the statically-imported lucide data. The brand set (simple-icons) stays
 * a lazily-loaded chunk, mirroring how the web build splits it. The result
 * runs under plain Node (>=18) via `npx`, so users don't need Bun installed.
 */
import { chmodSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = import.meta.dir;
const dist = join(root, "dist");
const outfile = join(dist, "index.js");

rmSync(dist, { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: [join(root, "src/index.ts")],
  outdir: dist,
  target: "node",
  format: "esm",
  minify: true,
  // Keep the brand set (simple-icons, dynamically imported) in its own chunk
  // so the common lucide/iconify path doesn't parse megabytes at startup.
  splitting: true,
});

if (!result.success) {
  for (const message of result.logs) {
    console.error(message);
  }
  process.exit(1);
}

// The bundler carries the entry shebang (#!/usr/bin/env bun) into the output;
// rewrite it to node so the published binary runs anywhere, not just on Bun.
const bundled = readFileSync(outfile, "utf8").replace(/^#![^\n]*\n/, "");
writeFileSync(outfile, `#!/usr/bin/env node\n${bundled}`);
chmodSync(outfile, 0o755);

const bytes = readFileSync(outfile).byteLength;
console.log(`built ${outfile} (${(bytes / 1024).toFixed(0)} KB)`);
