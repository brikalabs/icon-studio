import { Button } from "@brika/clay/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@brika/clay/components/select";
import { Slider, SliderValue } from "@brika/clay/components/slider";
import type { IconSpec } from "@brika/icon-studio-core";
import { Crosshair } from "lucide-react";
import { useEditorStore } from "../../state/editor-store";
import { ColorField } from "./ColorField";

const CANVAS_SIZES = [64, 128, 256, 512, 1024] as const;

interface SliderRowProps {
  readonly label: string;
  readonly value: number;
  readonly onChange: (next: number) => void;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly unit?: string;
  readonly decimals?: number;
}

function SliderRow({ label, ...slider }: Readonly<SliderRowProps>) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <SliderValue width="w-14" {...slider} />
      </div>
      <Slider
        value={slider.value}
        onChange={slider.onChange}
        min={slider.min}
        max={slider.max}
        step={slider.step}
      />
    </div>
  );
}

export function IconControls() {
  const spec = useEditorStore((state) => state.spec);
  const updateSpec = useEditorStore((state) => state.updateSpec);
  const markUndoBoundary = useEditorStore((state) => state.markUndoBoundary);
  const offsetRange = Math.round(spec.canvasSize / 2);

  const update = (partial: Partial<IconSpec>) => updateSpec(partial);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">Canvas</span>
        <Select
          value={String(spec.canvasSize)}
          onValueChange={(value) => {
            markUndoBoundary();
            update({ canvasSize: Number(value), offsetX: 0, offsetY: 0 });
          }}
        >
          <SelectTrigger size="sm" className="w-32" aria-label="Canvas size">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CANVAS_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} px
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ColorField
        label="Color"
        value={spec.iconColor}
        onChange={(iconColor) => {
          markUndoBoundary();
          update({ iconColor });
        }}
      />

      <SliderRow
        label="Size"
        value={Math.round(spec.iconScale * 100)}
        onChange={(percent) => update({ iconScale: percent / 100 })}
        min={5}
        max={150}
        step={1}
        unit="%"
      />

      {spec.icon.type === "lucide" ? (
        <SliderRow
          label="Stroke"
          value={spec.strokeWidth}
          onChange={(strokeWidth) => update({ strokeWidth })}
          min={0.25}
          max={6}
          step={0.25}
          decimals={2}
        />
      ) : null}

      <SliderRow
        label="Offset X"
        value={spec.offsetX}
        onChange={(offsetX) => update({ offsetX })}
        min={-offsetRange}
        max={offsetRange}
        step={1}
        unit="px"
      />
      <SliderRow
        label="Offset Y"
        value={spec.offsetY}
        onChange={(offsetY) => update({ offsetY })}
        min={-offsetRange}
        max={offsetRange}
        step={1}
        unit="px"
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          markUndoBoundary();
          update({ offsetX: 0, offsetY: 0 });
        }}
        disabled={spec.offsetX === 0 && spec.offsetY === 0}
      >
        <Crosshair />
        Re-center icon
      </Button>
    </div>
  );
}
