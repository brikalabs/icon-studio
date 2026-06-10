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
      <CollapsibleTrigger className="group -mx-1 flex w-[calc(100%+0.5rem)] items-center justify-between rounded-md px-1 py-1 transition-colors hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1">
        <SectionLabel>{label}</SectionLabel>
        <ChevronDown className="group-data-[state=closed]:-rotate-90 mr-0.5 size-3.5 text-muted-foreground transition-transform duration-150" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2.5">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export function ControlsPanel() {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
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
