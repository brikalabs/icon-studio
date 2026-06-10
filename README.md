# Icon Studio

Design square SVG icons for [Brika](https://brika.dev) plugins. Pick any of the
1700+ [lucide](https://lucide.dev) glyphs or 3000+ [simple-icons](https://simpleicons.org)
brand marks, drop in your own SVG, tune a multi-stop gradient, drag the icon
into place, and export clean, standalone SVG.

Built with [Clay](https://clay.brika.dev), Brika's design system.

## Features

- **Two icon libraries plus your own artwork**: lucide (stroke icons), brands
  (simple-icons, lazy-loaded chunk), or any SVG file via drag-and-drop.
- **Gradient engine**: linear and radial fills with 2 to 8 draggable color
  stops, angle control, radial center/radius, and 32 curated presets.
- **On-canvas editing**: click the icon to select it, then drag to move
  (snaps to center with guide lines), corner handles to resize, rotate handle
  to spin (shift snaps to 15°). Alignment shortcuts and sliders mirror
  everything in the panel.
- **Finish**: film-grain noise overlay, stroke-width control for lucide.
- **SVG-only export**: download, copy markup, or copy a share link.
- **Short share URLs**: only non-default settings are encoded, presets go by
  id, so a typical link is `?i=rocket&p=sunset`.

## Layout

| Workspace | Package | What it does |
| --- | --- | --- |
| `packages/core` | `@brika/icon-studio-core` | Pure SVG composition engine: `IconSpec` (zod), `buildIconSvg`, presets, icon catalogues + search, share-URL codec. No DOM, no React. |
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
bun packages/cli/src/index.ts rocket --stops "3F5EFB-9D50BB-FC466B" --angle 120 --rotate 15
bun packages/cli/src/index.ts github --lib brand --bg "#18181B"
bun packages/cli/src/index.ts database --bg "#18181B" --icon-color "#38EF7D" --noise 0.2
bun packages/cli/src/index.ts --search alarm
bun packages/cli/src/index.ts --custom logo.svg --preset ocean
```

The repo's own `apps/web/public/favicon.svg` is generated with it:

```sh
bun packages/cli/src/index.ts layout-grid --preset raycast --scale 0.5 -o apps/web/public/favicon.svg
```

## Deploy

The web app ships as a Cloudflare Worker with static assets
(`apps/web/wrangler.jsonc`). Pushes to `main` deploy via GitHub Actions; the
workflow needs two repo secrets:

- `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit)
- `CLOUDFLARE_ACCOUNT_ID`

Manual deploy: `bun run deploy` (requires `wrangler login`).
