import { Button } from "@brika/clay/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@brika/clay/components/select";
import { SliderValue } from "@brika/clay/components/slider";
import { type IconSpec, textFontFamilySchema, textFontWeightSchema } from "@brika/icon-studio-core";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  Crosshair,
  type LucideIcon,
} from "lucide-react";
import { useEditorStore } from "../../state/editor-store";
import { ColorField } from "./ColorField";
import { SliderRow } from "./SliderRow";

const CANVAS_SIZES: readonly number[] = [64, 128, 256, 512, 1024];
const FONT_FAMILY_LABELS: Readonly<Record<string, string>> = {
  sans: "Sans",
  serif: "Serif",
  mono: "Mono",
};

interface AlignAction {
  readonly id: string;
  readonly icon: LucideIcon;
  /** -1 start, 0 center, 1 end; null leaves the axis untouched. */
  readonly x: number | null;
  readonly y: number | null;
}

const ALIGN_ACTIONS: readonly AlignAction[] = [
  { id: "Align left", icon: AlignStartVertical, x: -1, y: null },
  { id: "Center horizontally", icon: AlignCenterVertical, x: 0, y: null },
  { id: "Align right", icon: AlignEndVertical, x: 1, y: null },
  { id: "Align top", icon: AlignStartHorizontal, x: null, y: -1 },
  { id: "Center vertically", icon: AlignCenterHorizontal, x: null, y: 0 },
  { id: "Align bottom", icon: AlignEndHorizontal, x: null, y: 1 },
];

/** Offset that puts the icon box flush to an edge (-1/1) or centered (0). */
function alignOffset(spec: IconSpec, position: number): number {
  const margin = (spec.canvasSize - spec.canvasSize * spec.iconScale) / 2;
  return Math.round(position * margin);
}

const ROW_LABEL = "text-muted-foreground text-xs font-medium uppercase tracking-wide";
const ROW = "flex items-center justify-between gap-3";

export function IconControls() {
  const spec = useEditorStore((state) => state.spec);
  const updateSpec = useEditorStore((state) => state.updateSpec);
  const markUndoBoundary = useEditorStore((state) => state.markUndoBoundary);
  const offsetRange = Math.round(spec.canvasSize / 2);

  return (
    <div className="flex flex-col gap-3">
      <div className={ROW}>
        <span className={ROW_LABEL}>Canvas</span>
        <Select
          value={String(spec.canvasSize)}
          onValueChange={(value) => {
            markUndoBoundary();
            updateSpec({ canvasSize: Number(value), offsetX: 0, offsetY: 0 });
          }}
        >
          <SelectTrigger size="sm" className="w-28" aria-label="Canvas size">
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
          updateSpec({ iconColor });
        }}
      />

      {spec.icon.type === "text" ? (
        <>
          <div className={ROW}>
            <span className={ROW_LABEL}>Font</span>
            <Select
              value={spec.icon.fontFamily}
              onValueChange={(value) => {
                const parsed = textFontFamilySchema.safeParse(value);
                if (parsed.success && spec.icon.type === "text") {
                  markUndoBoundary();
                  updateSpec({ icon: { ...spec.icon, fontFamily: parsed.data } });
                }
              }}
            >
              <SelectTrigger size="sm" className="w-28" aria-label="Monogram font family">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {textFontFamilySchema.options.map((family) => (
                  <SelectItem key={family} value={family}>
                    {FONT_FAMILY_LABELS[family] ?? family}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={ROW}>
            <span className={ROW_LABEL}>Weight</span>
            <Select
              value={spec.icon.fontWeight}
              onValueChange={(value) => {
                const parsed = textFontWeightSchema.safeParse(value);
                if (parsed.success && spec.icon.type === "text") {
                  markUndoBoundary();
                  updateSpec({ icon: { ...spec.icon, fontWeight: parsed.data } });
                }
              }}
            >
              <SelectTrigger size="sm" className="w-28" aria-label="Monogram font weight">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {textFontWeightSchema.options.map((weight) => (
                  <SelectItem key={weight} value={weight}>
                    {weight}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      ) : null}

      <div className={ROW}>
        <span className={ROW_LABEL}>Align</span>
        <div className="flex gap-0.5">
          {ALIGN_ACTIONS.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              size="icon-xs"
              aria-label={action.id}
              title={action.id}
              onClick={() => {
                markUndoBoundary();
                updateSpec({
                  ...(action.x === null ? {} : { offsetX: alignOffset(spec, action.x) }),
                  ...(action.y === null ? {} : { offsetY: alignOffset(spec, action.y) }),
                });
              }}
            >
              <action.icon />
            </Button>
          ))}
        </div>
      </div>

      <SliderRow
        label="Size"
        value={Math.round(spec.iconScale * 100)}
        onChange={(percent) => updateSpec({ iconScale: percent / 100 })}
        min={5}
        max={150}
        step={1}
        unit="%"
      />

      <SliderRow
        label="Rotation"
        value={Math.round(spec.rotation)}
        onChange={(rotation) => updateSpec({ rotation })}
        min={0}
        max={360}
        step={1}
        unit="°"
      />

      {spec.icon.type === "lucide" ? (
        <SliderRow
          label="Stroke"
          value={spec.strokeWidth}
          onChange={(strokeWidth) => updateSpec({ strokeWidth })}
          min={0.25}
          max={6}
          step={0.25}
          decimals={2}
        />
      ) : null}

      <div className={ROW}>
        <span className={ROW_LABEL}>Position</span>
        <div className="flex items-center gap-1">
          <SliderValue
            value={spec.offsetX}
            onChange={(offsetX) => updateSpec({ offsetX })}
            min={-offsetRange}
            max={offsetRange}
            step={1}
            unit="px"
            width="w-16"
          />
          <SliderValue
            value={spec.offsetY}
            onChange={(offsetY) => updateSpec({ offsetY })}
            min={-offsetRange}
            max={offsetRange}
            step={1}
            unit="px"
            width="w-16"
          />
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          markUndoBoundary();
          updateSpec({ offsetX: 0, offsetY: 0, rotation: 0 });
        }}
        disabled={spec.offsetX === 0 && spec.offsetY === 0 && spec.rotation === 0}
      >
        <Crosshair />
        Reset transform
      </Button>
    </div>
  );
}
