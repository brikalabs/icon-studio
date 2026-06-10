import { ToggleGroup, ToggleGroupItem } from "@brika/clay/components/toggle-group";
import { type Background, COVER_RADIUS, type GradientStop } from "@brika/icon-studio-core";
import { useEditorStore } from "../../state/editor-store";
import { ColorField } from "./ColorField";
import { GradientStopsEditor } from "./GradientStopsEditor";
import { SliderRow } from "./SliderRow";

function currentStops(background: Background): GradientStop[] {
  if (background.type === "solid") {
    return [
      { color: background.color, offset: 0 },
      { color: "#FC466B", offset: 1 },
    ];
  }
  return [...background.stops];
}

function convertBackground(current: Background, type: Background["type"]): Background {
  switch (type) {
    case "solid":
      return { type: "solid", color: currentStops(current)[0]?.color ?? "#18181B" };
    case "linear":
      return {
        type: "linear",
        stops: currentStops(current),
        angle: current.type === "linear" ? current.angle : 45,
      };
    case "radial":
      return {
        type: "radial",
        stops: currentStops(current),
        cx: 0.5,
        cy: 0.5,
        radius: COVER_RADIUS,
      };
  }
}

export function BackgroundControls() {
  const background = useEditorStore((state) => state.spec.background);
  const updateSpec = useEditorStore((state) => state.updateSpec);
  const markUndoBoundary = useEditorStore((state) => state.markUndoBoundary);

  const setBackground = (next: Background) => updateSpec({ background: next });

  return (
    <div className="flex flex-col gap-3">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        className="w-full"
        value={background.type}
        onValueChange={(value) => {
          if (value === "solid" || value === "linear" || value === "radial") {
            markUndoBoundary();
            setBackground(convertBackground(background, value));
          }
        }}
        aria-label="Fill type"
      >
        <ToggleGroupItem value="linear" className="flex-1">
          Linear
        </ToggleGroupItem>
        <ToggleGroupItem value="radial" className="flex-1">
          Radial
        </ToggleGroupItem>
        <ToggleGroupItem value="solid" className="flex-1">
          Solid
        </ToggleGroupItem>
      </ToggleGroup>

      {background.type === "solid" ? (
        <ColorField
          label="Color"
          value={background.color}
          onChange={(color) => {
            markUndoBoundary();
            setBackground({ ...background, color });
          }}
        />
      ) : (
        <GradientStopsEditor
          stops={background.stops}
          onChange={(stops) => setBackground({ ...background, stops })}
          onBoundary={markUndoBoundary}
        />
      )}

      {background.type === "linear" ? (
        <SliderRow
          label="Angle"
          value={background.angle}
          onChange={(angle) => setBackground({ ...background, angle })}
          min={0}
          max={360}
          step={1}
          unit="°"
        />
      ) : null}

      {background.type === "radial" ? (
        <>
          <SliderRow
            label="Center X"
            value={Math.round(background.cx * 100)}
            onChange={(cx) => setBackground({ ...background, cx: cx / 100 })}
            min={0}
            max={100}
            step={1}
            unit="%"
          />
          <SliderRow
            label="Center Y"
            value={Math.round(background.cy * 100)}
            onChange={(cy) => setBackground({ ...background, cy: cy / 100 })}
            min={0}
            max={100}
            step={1}
            unit="%"
          />
          <SliderRow
            label="Radius"
            value={Math.round(background.radius * 100)}
            onChange={(radius) => setBackground({ ...background, radius: radius / 100 })}
            min={5}
            max={150}
            step={1}
            unit="%"
          />
        </>
      ) : null}
    </div>
  );
}
