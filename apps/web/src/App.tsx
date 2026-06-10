import { Button } from "@brika/clay/components/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@brika/clay/components/sheet";
import { PanelLeft, SlidersHorizontal } from "lucide-react";
import { useEffect } from "react";
import { Header } from "./components/Header";
import { ControlsPanel } from "./features/controls/ControlsPanel";
import { CommandPalette } from "./features/palette/CommandPalette";
import { IconPicker } from "./features/picker/IconPicker";
import { PreviewCanvas } from "./features/preview/PreviewCanvas";
import { installShortcuts } from "./lib/shortcuts";
import { syncSpecToUrl, useEditorStore } from "./state/editor-store";

export function App() {
  const spec = useEditorStore((state) => state.spec);

  useEffect(() => {
    const handle = window.setTimeout(() => syncSpecToUrl(spec), 200);
    return () => window.clearTimeout(handle);
  }, [spec]);

  // A shared link to a lazy library needs its catalogue (or, for Iconify,
  // the specific icon) before it can render.
  useEffect(() => {
    const icon = spec.icon;
    if (icon.type === "iconify") {
      void useEditorStore.getState().loadIconifyIcons([icon.name]);
    } else if (icon.type !== "custom" && icon.type !== "text") {
      void useEditorStore.getState().loadLibrary(icon.type);
    }
  }, [spec.icon]);

  useEffect(() => installShortcuts(), []);

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 border-r bg-card md:block xl:w-72">
          <IconPicker />
        </aside>
        <section className="relative min-w-0 flex-1 bg-muted/20">
          <PreviewCanvas />
          {/* Narrow screens reach the side panels through sheet drawers. */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-card md:hidden"
                  aria-label="Open icon picker"
                >
                  <PanelLeft />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetTitle className="sr-only">Icon picker</SheetTitle>
                <IconPicker />
              </SheetContent>
            </Sheet>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-card lg:hidden"
                  aria-label="Open design controls"
                >
                  <SlidersHorizontal />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <SheetTitle className="sr-only">Design controls</SheetTitle>
                <ControlsPanel />
              </SheetContent>
            </Sheet>
          </div>
        </section>
        <aside className="hidden w-72 shrink-0 border-l bg-card lg:block xl:w-80">
          <ControlsPanel />
        </aside>
      </main>
      <CommandPalette />
    </div>
  );
}
