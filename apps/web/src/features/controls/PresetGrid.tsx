import { cn } from "@brika/clay/primitives";
import { backgroundPresets } from "@brika/icon-studio-core";
import { backgroundToCss } from "../../lib/gradient-css";
import { useEditorStore } from "../../state/editor-store";

export function PresetGrid() {
  const background = useEditorStore((state) => state.spec.background);
  const updateSpec = useEditorStore((state) => state.updateSpec);
  const markUndoBoundary = useEditorStore((state) => state.markUndoBoundary);
  const activeId = backgroundPresets.find(
    (preset) => JSON.stringify(preset.background) === JSON.stringify(background),
  )?.id;

  return (
    <div className="grid grid-cols-8 gap-1.5">
      {backgroundPresets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          title={preset.id}
          aria-label={`${preset.id} background preset`}
          aria-pressed={preset.id === activeId}
          onClick={() => {
            markUndoBoundary();
            updateSpec({ background: preset.background });
          }}
          className={cn(
            "aspect-square rounded-md transition-all duration-150",
            preset.id === activeId
              ? "ring-2 ring-ring ring-offset-2 ring-offset-background scale-105"
              : "opacity-80 hover:opacity-100 hover:scale-110 hover:shadow-sm",
          )}
          style={{ background: backgroundToCss(preset.background) }}
        />
      ))}
    </div>
  );
}
