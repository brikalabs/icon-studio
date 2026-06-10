import { Button } from "@brika/clay/components/button";
import { SliderValue } from "@brika/clay/components/slider";
import type { GradientStop } from "@brika/icon-studio-core";
import { Plus, X } from "lucide-react";
import { useRef } from "react";
import { stopsToCss } from "../../lib/gradient-css";
import { ColorSwatchButton } from "./ColorField";

const MAX_STOPS = 8;

interface GradientStopsEditorProps {
  readonly stops: readonly GradientStop[];
  readonly onChange: (stops: GradientStop[]) => void;
  /** Called before a discrete edit so it lands in its own undo step. */
  readonly onBoundary: () => void;
}

function channel(hex: string, at: number): number {
  return Number.parseInt(hex.slice(at, at + 2), 16);
}

function toHex(value: number): string {
  return value.toString(16).padStart(2, "0").toUpperCase();
}

/** Midpoint color between the two stops surrounding `offset` (cheap hex lerp). */
function colorAt(stops: readonly GradientStop[], offset: number): string {
  const sorted = [...stops].sort((a, b) => a.offset - b.offset);
  const after = sorted.find((stop) => stop.offset >= offset) ?? sorted.at(-1);
  const before = sorted.findLast((stop) => stop.offset <= offset) ?? sorted.at(0);
  if (!before || !after) {
    return "#FFFFFF";
  }
  const span = after.offset - before.offset;
  const t = span === 0 ? 0 : (offset - before.offset) / span;
  const blend = (at: number): string => {
    const from = channel(before.color, at);
    const to = channel(after.color, at);
    return toHex(Math.round(from + (to - from) * t));
  };
  return `#${blend(1)}${blend(3)}${blend(5)}`;
}

/**
 * Multi-stop gradient editor: a gradient bar with draggable stop handles
 * (click an empty spot to insert a stop), plus per-stop color and position
 * rows below.
 */
export function GradientStopsEditor({
  stops,
  onChange,
  onBoundary,
}: Readonly<GradientStopsEditorProps>) {
  const barRef = useRef<HTMLDivElement>(null);
  const dragIndex = useRef<number | null>(null);

  const setStop = (index: number, patch: Partial<GradientStop>) => {
    onChange(stops.map((stop, at) => (at === index ? { ...stop, ...patch } : stop)));
  };

  const offsetFromPointer = (clientX: number): number => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) {
      return 0;
    }
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const addStopAt = (clientX: number) => {
    if (stops.length >= MAX_STOPS) {
      return;
    }
    const offset = offsetFromPointer(clientX);
    onBoundary();
    onChange([...stops, { color: colorAt(stops, offset), offset }]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={barRef}
        className="relative h-6 cursor-copy rounded-md border border-border/50"
        style={{ background: `linear-gradient(90deg, ${stopsToCss(stops)})` }}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            addStopAt(event.clientX);
          }
        }}
        title="Click to add a stop"
      >
        {stops.map((stop, index) => (
          <button
            // biome-ignore lint/suspicious/noArrayIndexKey: stops have no identity beyond their slot; an index key stays stable while a handle is dragged (a value-derived key would remount mid-drag and drop pointer capture)
            key={index}
            type="button"
            aria-label={`Gradient stop ${index + 1}`}
            className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 size-4 cursor-ew-resize rounded-full border-2 border-white shadow-md"
            style={{ left: `${stop.offset * 100}%`, background: stop.color }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              onBoundary();
              dragIndex.current = index;
            }}
            onPointerMove={(event) => {
              if (dragIndex.current === index) {
                setStop(index, { offset: offsetFromPointer(event.clientX) });
              }
            }}
            onPointerUp={() => {
              dragIndex.current = null;
            }}
          />
        ))}
      </div>

      {stops.map((stop, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: stop rows mirror the handle list above; same slot-identity reasoning
        <div key={index} className="flex items-center justify-between gap-2">
          <ColorSwatchButton
            label={`Stop ${index + 1}`}
            value={stop.color}
            onChange={(color) => {
              onBoundary();
              setStop(index, { color });
            }}
          />
          <div className="flex items-center gap-1">
            <SliderValue
              value={Math.round(stop.offset * 100)}
              onChange={(next) => setStop(index, { offset: next / 100 })}
              min={0}
              max={100}
              step={1}
              unit="%"
              width="w-12"
            />
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Remove stop ${index + 1}`}
              disabled={stops.length <= 2}
              onClick={() => {
                onBoundary();
                onChange(stops.filter((_, at) => at !== index));
              }}
            >
              <X />
            </Button>
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        disabled={stops.length >= MAX_STOPS}
        onClick={() => {
          onBoundary();
          onChange([...stops, { color: colorAt(stops, 0.5), offset: 0.5 }]);
        }}
      >
        <Plus />
        Add stop
      </Button>
    </div>
  );
}
