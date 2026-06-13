# @brika/icon-studio

Generate square SVG plugin icons from the command line. Pick from 200,000+
glyphs (lucide, simple-icons brand marks, and the whole Iconify catalogue), or
type a monogram; drop them on a multi-stop gradient with optional glare and
film grain; export a clean, standalone SVG.

It's the terminal companion to the [Icon Studio editor](https://icon.brika.dev)
— both render through the same engine, so the CLI output is byte-for-byte what
you'd get from the web app.

## Install

No install needed — run it with `npx`:

```sh
npx @brika/icon-studio bell --preset iris -o icon.svg
```

Or install the `brika-icon` binary globally:

```sh
npm i -g @brika/icon-studio
brika-icon bell --preset iris -o icon.svg
```

Requires Node.js 18+ (for the bundled `iconify` network path). No Bun required.

## Examples

```sh
brika-icon bell --preset sunset -o assets/icon.svg
brika-icon rocket --stops "3F5EFB-9D50BB-FC466B" --angle 120 --rotate 15
brika-icon github --lib brand --bg "#18181B"
brika-icon tabler:bolt --lib iconify --preset midnight       # any Iconify icon
brika-icon database --bg "#18181B" --icon-color "#38EF7D" --noise 0.2
brika-icon --text BR --font mono --preset midnight --glare 0.4
brika-icon --custom logo.svg --preset ocean
brika-icon --search alarm --lib iconify
brika-icon --list-presets
```

## Libraries

| `--lib`    | Source                                    |
| ---------- | ----------------------------------------- |
| `lucide`   | [Lucide](https://lucide.dev) (default)    |
| `brand`    | [simple-icons](https://simpleicons.org) brand marks |
| `iconify`  | Any [Iconify](https://iconify.design) icon as `prefix:name` (needs network) |

Run `brika-icon --help` for the full option list (size, gradient stops, scale,
offset, rotation, stroke width, noise, glare, monogram font/weight, …).

## License

MIT © Brika Labs. Icon sets keep their upstream licenses.
