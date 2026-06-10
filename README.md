# Icon Studio

Design square SVG icons for [Brika](https://brika.dev) plugins. Pick any of the
1700+ [lucide](https://lucide.dev) glyphs or paste your own SVG, tune the
background gradient, drag the icon into place, and export clean, standalone SVG.

Built with [Clay](https://clay.brika.dev), Brika's design system.

## Layout

| Workspace | Package | What it does |
| --- | --- | --- |
| `packages/core` | `@brika/icon-studio-core` | Pure SVG composition engine: `IconSpec` (zod), `buildIconSvg`, presets, lucide catalogue + search, shareable-URL codec. No DOM, no React. |
| `packages/cli` | `@brika/icon-studio-cli` | `brika-icon`, generate icons from the terminal. |
| `apps/web` | `@brika/icon-studio-web` | The editor: Vite + React + Clay, deployed on Cloudflare Workers. |

Everything renders through the same `buildIconSvg`, so the web preview, the CLI
output, and the exported file are always identical.

## Develop

```sh
bun install
bun run dev        # editor at http://localhost:5173
bun test packages  # core + cli tests
bun run typecheck
bun run lint
```

## CLI

```sh
bun packages/cli/src/index.ts --help

# examples
bun packages/cli/src/index.ts bell --preset sunset -o icon.svg
bun packages/cli/src/index.ts rocket --from "#3F5EFB" --to "#FC466B" --angle 45
bun packages/cli/src/index.ts database --bg "#18181B" --icon-color "#38EF7D"
bun packages/cli/src/index.ts --search alarm
bun packages/cli/src/index.ts --custom logo.svg --preset ocean
```

The repo's own `apps/web/public/favicon.svg` is generated with it:

```sh
bun packages/cli/src/index.ts layout-grid --preset raycast --scale 0.5 -o apps/web/public/favicon.svg
```

## Share links

Every editor state mirrors into the URL (`?icon=bell&bg=linear&from=3F5EFB...`),
so copying the address shares the exact design. Pasted custom SVGs stay local,
they are never serialized into the link.

## Deploy

The web app ships as a Cloudflare Worker with static assets
(`apps/web/wrangler.jsonc`). Pushes to `main` deploy via GitHub Actions; the
workflow needs two repo secrets:

- `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit)
- `CLOUDFLARE_ACCOUNT_ID`

Manual deploy: `bun run deploy` (requires `wrangler login`).
