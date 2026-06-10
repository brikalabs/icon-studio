import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@brika/clay/components/select";
import { Slider, SliderValue } from "@brika/clay/components/slider";
import type { Background } from "@brika/icon-studio-core";
import { useEditorStore } from "../../state/editor-store";
import { ColorField } from "./ColorField";

const FALLBACK_GRADIENT = { from: "#3F5EFB", to: "#FC466B" };

function convertBackground(current: Background, type: Background["type"]): Background {
  const from = current.type === "solid" ? current.color : current.from;
  const to = current.type === "solid" ? FALLBACK_GRADIENT.to : current.to;
  switch (type) {
    case "solid":
      return { type: "solid", color: from };
    case "radial":
      return { type: "radial", from, to };
    case "linear":
      return { type: "linear", from, to, angle: current.type === "linear" ? current.angle : 45 };
  }
}

export function BackgroundControls() {
  const background = useEditorStore((state) => state.spec.background);
  const updateSpec = useEditorStore((state) => state.updateSpec);
  const markUndoBoundary = useEditorStore((state) => state.markUndoBoundary);

  const setBackground = (next: Background, boundary = true) => {
    if (boundary) {
      markUndoBoundary();
    }
    updateSpec({ background: next });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">Fill type</span>
        <Select
          value={background.type}
          onValueChange={(value) => {
            if (value === "solid" || value === "linear" || value === "radial") {
              setBackground(convertBackground(background, value));
            }
          }}
        >
          <SelectTrigger size="sm" className="w-32" aria-label="Fill type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="linear">Linear</SelectItem>
            <SelectItem value="radial">Radial</SelectItem>
            <SelectItem value="solid">Solid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {background.type === "solid" ? (
        <ColorField
          label="Color"
          value={background.color}
          onChange={(color) => setBackground({ ...background, color })}
        />
      ) : (
        <>
          <ColorField
            label="Start color"
            value={background.from}
            onChange={(from) => setBackground({ ...background, from })}
          />
          <ColorField
            label="End color"
            value={background.to}
            onChange={(to) => setBackground({ ...background, to })}
          />
        </>
      )}

      {background.type === "linear" ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Angle</span>
            <SliderValue
              value={background.angle}
              onChange={(angle) => setBackground({ ...background, angle }, false)}
              min={0}
              max={360}
              step={1}
              unit="°"
            />
          </div>
          <Slider
            value={background.angle}
            onChange={(angle) => setBackground({ ...background, angle }, false)}
            min={0}
            max={360}
            step={1}
            ticks={[0, 90, 180, 270, 360]}
          />
        </div>
      ) : null}
    </div>
  );
}
