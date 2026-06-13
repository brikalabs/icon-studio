# Changelog


## v0.1.1

Maintenance release. Validates the automated npm publish pipeline (GitHub
Actions Trusted Publishing / OIDC). No changes to the CLI itself.


## v0.1.0

Initial release of `@brika/icon-studio` — the `brika-icon` command-line tool.
Icons render through the same engine as the [Icon Studio editor](https://icon.brika.dev),
so CLI output matches the web app byte-for-byte.

### 🚀 Enhancements

- Generate square, standalone SVG icons from the terminal
- Icon sources: lucide (default), simple-icons brand marks (`--lib brand`), the full Iconify catalogue (`--lib iconify`), custom SVG files (`--custom`), and 1–4 character monograms (`--text`)
- Backgrounds: 32 curated presets, solid colors, and linear/radial multi-stop gradients with angle control
- Styling: icon color, scale, offset, rotation, stroke width, film-grain noise, and glossy glare
- `--search`, `--list-presets`, and `--help` helpers
- Bundled for Node ≥18 with zero runtime dependencies; the brand set lazy-loads only when used

### ❤️ Contributors

- Maxime Scharwath <maxscharwath@gmail.com>
