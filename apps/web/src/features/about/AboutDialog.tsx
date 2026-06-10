import { BrikaLogo } from "@brika/clay/components/brika-logo";
import { Button } from "@brika/clay/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@brika/clay/components/dialog";
import { Kbd, KbdGroup } from "@brika/clay/components/kbd";
import { SectionLabel } from "@brika/clay/components/section-label";
import { Separator } from "@brika/clay/components/separator";
import { ArrowUpRight, Code2, Globe, Info, Palette } from "lucide-react";
import { CANVAS_TIPS, KEYBOARD_SHORTCUTS } from "../../lib/shortcuts";

const LINKS = [
  {
    label: "Source on GitHub",
    detail: "MIT licensed, contributions welcome",
    href: "https://github.com/brikalabs/icon-studio",
    icon: Code2,
  },
  {
    label: "brika.dev",
    detail: "The plugin platform these icons are for",
    href: "https://brika.dev",
    icon: Globe,
  },
  {
    label: "Clay design system",
    detail: "The component library behind this UI",
    href: "https://clay.brika.dev",
    icon: Palette,
  },
];

export function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="About Icon Studio">
          <Info />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrikaLogo className="size-5" />
            Icon Studio
          </DialogTitle>
          <DialogDescription>
            Design square SVG icons for Brika plugins: pick from 200,000+ glyphs or type a monogram,
            tune the gradient, export clean SVG.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Left column: the why + links */}
          <div className="flex min-w-0 flex-col gap-4">
            <p className="text-muted-foreground text-sm leading-relaxed">
              Every Brika plugin ships a square icon, and a good one should take seconds, not a
              design tool. One rendering engine drives the preview, the CLI, and the exported file,
              so what you see is exactly what ships, and a share link encodes the whole design.
            </p>

            <div className="flex flex-col gap-1">
              {LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1"
                >
                  <link.icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{link.label}</span>
                    <span className="block truncate text-muted-foreground text-xs">
                      {link.detail}
                    </span>
                  </span>
                  <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Right column: keyboard shortcuts, balanced against the left */}
          <div className="flex min-w-0 flex-col gap-2">
            <SectionLabel>Keyboard shortcuts</SectionLabel>
            <div className="flex flex-col gap-1.5">
              {KEYBOARD_SHORTCUTS.map((shortcut) => (
                <div key={shortcut.description} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-muted-foreground text-xs">
                    {shortcut.description}
                  </span>
                  <KbdGroup className="shrink-0">
                    {shortcut.keys.map((key) => (
                      <Kbd key={key}>{key}</Kbd>
                    ))}
                  </KbdGroup>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        <section className="flex flex-col gap-2">
          <SectionLabel>On the canvas</SectionLabel>
          <div className="grid gap-2 sm:grid-cols-3">
            {CANVAS_TIPS.map((tip) => (
              <p
                key={tip}
                className="rounded-md bg-muted/40 px-2.5 py-2 text-muted-foreground text-xs leading-relaxed"
              >
                {tip}
              </p>
            ))}
          </div>
        </section>

        <p className="text-center text-muted-foreground/70 text-xs">
          Open source under the MIT license. Built with Clay, standing on lucide, Tabler, Heroicons,
          Simple Icons, and Iconify. Icon sets keep their own licenses, shown in the set browser.
        </p>
      </DialogContent>
    </Dialog>
  );
}
