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
import { Code2, ExternalLink, Info } from "lucide-react";
import { CANVAS_TIPS, KEYBOARD_SHORTCUTS } from "../../lib/shortcuts";

const LINKS = [
  { label: "Source on GitHub", href: "https://github.com/brikalabs/icon-studio", icon: Code2 },
  { label: "brika.dev", href: "https://brika.dev", icon: ExternalLink },
  { label: "Clay design system", href: "https://clay.brika.dev", icon: ExternalLink },
];

export function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="About Icon Studio">
          <Info />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
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

        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
          <p className="text-muted-foreground text-sm">
            Every Brika plugin ships a square icon, and making a good one should take seconds, not a
            design tool. One rendering engine drives the live preview, the CLI, and the exported
            file, so what you see is exactly what ships. Share links encode the whole design in a
            few characters.
          </p>

          <div className="flex flex-wrap gap-2">
            {LINKS.map((link) => (
              <Button key={link.href} variant="outline" size="sm" asChild>
                <a href={link.href} target="_blank" rel="noreferrer">
                  <link.icon />
                  {link.label}
                </a>
              </Button>
            ))}
          </div>

          <p className="text-muted-foreground text-xs">
            Open source under the MIT license. Built with Clay, and standing on lucide, Tabler,
            Heroicons, Simple Icons, and the Iconify project. Icon sets keep their own licenses,
            shown in the set browser.
          </p>

          <Separator />

          <section className="flex flex-col gap-2">
            <SectionLabel>Keyboard shortcuts</SectionLabel>
            {KEYBOARD_SHORTCUTS.map((shortcut) => (
              <div key={shortcut.description} className="flex items-center justify-between gap-4">
                <span className="text-sm">{shortcut.description}</span>
                <KbdGroup>
                  {shortcut.keys.map((key) => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </KbdGroup>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-2">
            <SectionLabel>On the canvas</SectionLabel>
            <ul className="flex list-disc flex-col gap-1 pl-4 text-muted-foreground text-sm">
              {CANVAS_TIPS.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
