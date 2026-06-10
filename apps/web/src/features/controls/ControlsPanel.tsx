import { SectionLabel } from "@brika/clay/components/section-label";
import { Separator } from "@brika/clay/components/separator";
import { BackgroundControls } from "./BackgroundControls";
import { IconControls } from "./IconControls";
import { PresetGrid } from "./PresetGrid";

export function ControlsPanel() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <section className="flex flex-col gap-3">
        <SectionLabel>Presets</SectionLabel>
        <PresetGrid />
      </section>
      <Separator />
      <section className="flex flex-col gap-3">
        <SectionLabel>Background</SectionLabel>
        <BackgroundControls />
      </section>
      <Separator />
      <section className="flex flex-col gap-3">
        <SectionLabel>Icon</SectionLabel>
        <IconControls />
      </section>
    </div>
  );
}
