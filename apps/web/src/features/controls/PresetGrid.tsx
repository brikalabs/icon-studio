import { cn } from "@brika/clay/primitives";
import { type Background, type BackgroundPreset, backgroundPresets } from "@brika/icon-studio-core";
import { useEditorStore } from "../../state/editor-store";

function backgroundCss(background: Background): string {
  switch (background.type) {
    case "solid":
      return background.color;
    case "linear":
      return `linear-gradient(${background.angle}deg, ${background.from}, ${background.to})`;
    case "radial":
      return `radial-gradient(circle, ${background.from}, ${background.to})`;
  }
}

function isActive(preset: BackgroundPreset, current: Background): boolean {
  return JSON.stringify(preset.background) === JSON.stringify(current);
}

export function PresetGrid() {
  const background = useEditorStore((state) => state.spec.background);
  const updateSpec = useEditorStore((state) => state.updateSpec);
  const markUndoBoundary = useEditorStore((state) => state.markUndoBoundary);

  return (
    <div className="grid grid-cols-8 gap-2">
      {backgroundPresets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          title={preset.id}
          aria-label={`${preset.id} background preset`}
          aria-pressed={isActive(preset, background)}
          onClick={() => {
            markUndoBoundary();
            updateSpec({ background: preset.background });
          }}
          className={cn(
            "aspect-square rounded-md border border-border/50 transition-transform hover:scale-110",
            isActive(preset, background) && "ring-2 ring-ring ring-offset-2 ring-offset-background",
          )}
          style={{ background: backgroundCss(preset.background) }}
        />
      ))}
    </div>
  );
}
