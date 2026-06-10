import { Button } from "@brika/clay/components/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@brika/clay/components/sheet";
import { iconLibraries } from "@brika/icon-studio-core";
import { PanelLeft, SlidersHorizontal } from "lucide-react";
import { useEffect } from "react";
import { Header } from "./components/Header";
import { ControlsPanel } from "./features/controls/ControlsPanel";
import { CommandPalette } from "./features/palette/CommandPalette";
import { IconPicker } from "./features/picker/IconPicker";
import { PreviewCanvas } from "./features/preview/PreviewCanvas";
import { SEARCH_INPUT_ID } from "./lib/shortcuts";
import { copySvg, exportSvg } from "./lib/spec-actions";
import { previewMaskSchema, syncSpecToUrl, useEditorStore } from "./state/editor-store";

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const editable = isEditableTarget(event.target);
      const store = useEditorStore.getState();
      const key = event.key.toLowerCase();

      if (event.metaKey || event.ctrlKey) {
        // Export must intercept the browser's save dialog even from inputs.
        if (key === "s") {
          event.preventDefault();
          exportSvg();
          return;
        }
        if (editable) {
          return;
        }
        if (key === "z") {
          event.preventDefault();
          if (event.shiftKey) {
            store.redo();
          } else {
            store.undo();
          }
        } else if (key === "y") {
          event.preventDefault();
          store.redo();
        } else if (key === "c" && event.shiftKey) {
          event.preventDefault();
          void copySvg();
        }
        return;
      }

      if (editable) {
        return;
      }
      if (event.key === "/") {
        event.preventDefault();
        const search = document.getElementById(SEARCH_INPUT_ID);
        if (search instanceof HTMLElement) {
          search.focus();
        }
        return;
      }
      if (key === "m") {
        const order = previewMaskSchema.options;
        const next = order[(order.indexOf(store.previewMask) + 1) % order.length];
        if (next) {
          store.setPreviewMask(next);
        }
        return;
      }
      const digit = Number.parseInt(event.key, 10);
      const library = iconLibraries[digit - 1];
      if (library) {
        store.setPickerLibrary(library.id);
        void store.loadLibrary(library.id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
