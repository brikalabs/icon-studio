import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@brika/clay/components/collapsible";
import { SectionLabel } from "@brika/clay/components/section-label";
import { Separator } from "@brika/clay/components/separator";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { BackgroundControls } from "./BackgroundControls";
import { EffectsControls } from "./EffectsControls";
import { IconControls } from "./IconControls";
import { PresetGrid } from "./PresetGrid";

interface PanelSectionProps {
  readonly label: string;
  readonly children: ReactNode;
}

function PanelSection({ label, children }: Readonly<PanelSectionProps>) {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="group flex w-full items-center justify-between">
        <SectionLabel>{label}</SectionLabel>
        <ChevronDown className="group-data-[state=closed]:-rotate-90 size-4 text-muted-foreground transition-transform" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export function ControlsPanel() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <PanelSection label="Presets">
        <PresetGrid />
      </PanelSection>
      <Separator />
      <PanelSection label="Background">
        <BackgroundControls />
      </PanelSection>
      <Separator />
      <PanelSection label="Effects">
        <EffectsControls />
      </PanelSection>
      <Separator />
      <PanelSection label="Icon">
        <IconControls />
      </PanelSection>
    </div>
  );
}
