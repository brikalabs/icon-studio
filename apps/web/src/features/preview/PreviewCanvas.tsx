import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@brika/clay/components/select";
import { ToggleGroup, ToggleGroupItem } from "@brika/clay/components/toggle-group";
import {
  buildIconSvg,
  getIconGlyph,
  isIconifyIconMissing,
  isIconLibraryReady,
} from "@brika/icon-studio-core";
import { Circle, Square, SquareRoundCorner, Squircle } from "lucide-react";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { svgToDataUri } from "../../lib/svg-io";
import { type PreviewMask, previewMaskSchema, useEditorStore } from "../../state/editor-store";
import { SelectionOverlay } from "./SelectionOverlay";

const MAX_FIT_SIZE = 480;
const MIN_FIT_SIZE = 220;
/** Drag snaps to the canvas center inside this many display pixels. */
const SNAP_DISTANCE = 6;

const ZOOM_OPTIONS: readonly number[] = [0.25, 0.5, 1, 2];

/** Superellipse |x|^n + |y|^n = 1 sampled as a percentage polygon (iOS-style squircle at n=5). */
function superellipseClip(exponent: number, samples: number): string {
  const points: string[] = [];
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * 2 * Math.PI;
    const along = (value: number) =>
      (50 + 50 * Math.sign(value) * Math.abs(value) ** (2 / exponent)).toFixed(2);
    points.push(`${along(Math.cos(t))}% ${along(Math.sin(t))}%`);
  }
  return `polygon(${points.join(", ")})`;
}

const MASK_STYLES: Record<PreviewMask, CSSProperties> = {
  square: {},
  rounded: { borderRadius: "20%" },
  squircle: { clipPath: superellipseClip(5, 96) },
  circle: { borderRadius: "50%" },
};

const MASK_OPTIONS = [
  { id: "square", label: "Square", icon: Square },
  { id: "rounded", label: "Rounded corners", icon: SquareRoundCorner },
  { id: "squircle", label: "Squircle", icon: Squircle },
  { id: "circle", label: "Circle", icon: Circle },
] as const;

interface DragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startOffsetX: number;
  startOffsetY: number;
}

interface SnappedAxes {
  x: boolean;
  y: boolean;
}

/**
 * Renders the composed SVG through an <img data-uri>, so the preview is the
 * exact artifact the exporter produces. Clicking selects the icon (showing
 * the transform handles); dragging or arrow keys move it, snapping to the
 * canvas center with guide lines.
 */
export function PreviewCanvas() {
  const spec = useEditorStore((state) => state.spec);
  const selected = useEditorStore((state) => state.selected);
  const setSelected = useEditorStore((state) => state.setSelected);
  const updateSpec = useEditorStore((state) => state.updateSpec);
  const markUndoBoundary = useEditorStore((state) => state.markUndoBoundary);
  const catalogueVersion = useEditorStore((state) => state.catalogueVersion);
  const previewMask = useEditorStore((state) => state.previewMask);
  const setPreviewMask = useEditorStore((state) => state.setPreviewMask);
  const zoom = useEditorStore((state) => state.zoom);
  const setZoom = useEditorStore((state) => state.setZoom);
  const dragRef = useRef<DragState | null>(null);
  const [snapped, setSnapped] = useState<SnappedAxes>({ x: false, y: false });

  // The canvas fits the available space at 100%; zoom scales from there
  // (the scroll container takes over when it no longer fits).
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fitSize, setFitSize] = useState(MAX_FIT_SIZE);
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box) {
        setFitSize(
          Math.max(MIN_FIT_SIZE, Math.min(MAX_FIT_SIZE, box.width - 64, box.height - 128)),
        );
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const displaySize = Math.round(fitSize * zoom);

  const waitingForLibrary =
    spec.icon.type !== "custom" &&
    spec.icon.type !== "text" &&
    (!isIconLibraryReady(spec.icon.type) ||
      (spec.icon.type === "iconify" &&
        !getIconGlyph("iconify", spec.icon.name) &&
        !isIconifyIconMissing(spec.icon.name)));
  // biome-ignore lint/correctness/useExhaustiveDependencies(catalogueVersion): catalogues live outside React; the version bump is what turns a loading state into a render
  const rendered = useMemo(() => {
    if (waitingForLibrary) {
      return { uri: null, error: "Loading icons..." };
    }
    try {
      return { uri: svgToDataUri(buildIconSvg(spec)), error: null };
    } catch (error) {
      return { uri: null, error: error instanceof Error ? error.message : "Invalid icon spec" };
    }
  }, [spec, waitingForLibrary, catalogueVersion]);

  const scaleToCanvas = spec.canvasSize / displaySize;
  const snapThreshold = SNAP_DISTANCE * scaleToCanvas;

  const snapOffset = (value: number): number => (Math.abs(value) < snapThreshold ? 0 : value);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelected(true);
    markUndoBoundary();
    dragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOffsetX: spec.offsetX,
      startOffsetY: spec.offsetY,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    const rawX = drag.startOffsetX + (event.clientX - drag.startClientX) * scaleToCanvas;
    const rawY = drag.startOffsetY + (event.clientY - drag.startClientY) * scaleToCanvas;
    const offsetX = Math.round(snapOffset(rawX));
    const offsetY = Math.round(snapOffset(rawY));
    setSnapped({ x: offsetX === 0 && rawX !== 0, y: offsetY === 0 && rawY !== 0 });
    updateSpec({ offsetX, offsetY });
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setSnapped({ x: false, y: false });
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      setSelected(false);
      return;
    }
    const step = event.shiftKey ? 10 : 1;
    const moves: Record<string, { x: number; y: number }> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      updateSpec({ offsetX: spec.offsetX + move.x, offsetY: spec.offsetY + move.y });
    }
  };

  return (
    <div className="preview-stage relative h-full">
      <div
        ref={scrollRef}
        className="h-full overflow-auto"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            setSelected(false);
          }
        }}
      >
        <div
          className="flex min-h-full w-max min-w-full flex-col items-center justify-center gap-4 p-8"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelected(false);
            }
          }}
        >
          <div
            role="application"
            aria-label="Icon preview. Click to select, drag or use arrow keys to move the icon, Escape to deselect."
            // biome-ignore lint/a11y/noNoninteractiveTabindex: this is a 2D drag surface with pointer and arrow-key handlers; it must be focusable for the keyboard interaction
            tabIndex={0}
            className="checkerboard preview-canvas-shadow relative cursor-move touch-none select-none rounded-xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
            style={{ width: displaySize, height: displaySize }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onKeyDown={onKeyDown}
            onDoubleClick={() => {
              markUndoBoundary();
              updateSpec({ offsetX: 0, offsetY: 0 });
            }}
          >
            {rendered.uri ? (
              <>
                {previewMask !== "square" ? (
                  // Ghost of the full square, so the cropped area stays visible.
                  <img
                    src={rendered.uri}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    className="absolute inset-0 h-full w-full opacity-20"
                  />
                ) : null}
                <img
                  src={rendered.uri}
                  alt="Generated icon preview"
                  draggable={false}
                  className="relative h-full w-full"
                  style={MASK_STYLES[previewMask]}
                />
                {snapped.x ? (
                  <div className="-translate-x-1/2 pointer-events-none absolute inset-y-0 left-1/2 w-px bg-primary/80" />
                ) : null}
                {snapped.y ? (
                  <div className="-translate-y-1/2 pointer-events-none absolute inset-x-0 top-1/2 h-px bg-primary/80" />
                ) : null}
                {selected ? <SelectionOverlay displaySize={displaySize} /> : null}
              </>
            ) : (
              <div
                className={`flex h-full items-center justify-center p-8 text-center text-sm ${
                  waitingForLibrary ? "text-muted-foreground" : "text-destructive"
                }`}
              >
                {rendered.error}
              </div>
            )}
          </div>

          {/* Toolbar: Clay ToggleGroup (mask) + size readout + Clay Select (zoom).
              Each is a self-framed Clay control, so there is no outer pill. */}
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              size="sm"
              value={previewMask}
              onValueChange={(value) => {
                const parsed = previewMaskSchema.safeParse(value);
                if (parsed.success) {
                  setPreviewMask(parsed.data);
                }
              }}
              aria-label="Preview mask shape"
            >
              {MASK_OPTIONS.map((option) => (
                <ToggleGroupItem
                  key={option.id}
                  value={option.id}
                  aria-label={`${option.label} preview`}
                  title={option.label}
                >
                  <option.icon className="size-4" />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <span className="font-mono text-muted-foreground text-xs tabular-nums">
              {spec.canvasSize} px
            </span>

            <Select
              value={String(zoom)}
              onValueChange={(value) => {
                const next = Number(value);
                if (ZOOM_OPTIONS.includes(next)) {
                  setZoom(next);
                }
              }}
            >
              <SelectTrigger
                size="sm"
                className="w-20 font-mono text-xs tabular-nums"
                aria-label="Preview zoom"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {ZOOM_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)} className="font-mono text-xs">
                    {Math.round(option * 100)}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reserved line: appearing text must not shift the toolbar above. */}
          <span
            aria-hidden={previewMask === "square"}
            className={`h-4 text-muted-foreground/70 text-xs transition-opacity ${
              previewMask === "square" ? "opacity-0" : "opacity-100"
            }`}
          >
            Mask is preview only, exports stay square
          </span>
        </div>
      </div>
    </div>
  );
}
