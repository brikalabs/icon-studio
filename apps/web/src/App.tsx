import { useEffect } from "react";
import { Header } from "./components/Header";
import { ControlsPanel } from "./features/controls/ControlsPanel";
import { CommandPalette } from "./features/palette/CommandPalette";
import { IconPicker } from "./features/picker/IconPicker";
import { PreviewCanvas } from "./features/preview/PreviewCanvas";
import { syncSpecToUrl, useEditorStore } from "./state/editor-store";

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
    } else if (icon.type !== "custom") {
      void useEditorStore.getState().loadLibrary(icon.type);
    }
  }, [spec.icon]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || isEditableTarget(event.target)) {
        return;
      }
      const { undo, redo } = useEditorStore.getState();
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="flex min-h-0 flex-1">
        <aside className="w-72 shrink-0 border-r">
          <IconPicker />
        </aside>
        <section className="min-w-0 flex-1 bg-muted/20">
          <PreviewCanvas />
        </section>
        <aside className="w-80 shrink-0 border-l">
          <ControlsPanel />
        </aside>
      </main>
      <CommandPalette />
    </div>
  );
}
