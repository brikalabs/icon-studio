import { buildIconSvg } from "@brika/icon-studio-core";
import { useMemo, useRef, useState } from "react";
import { svgToDataUri } from "../../lib/svg-io";
import { useEditorStore } from "../../state/editor-store";
import { SelectionOverlay } from "./SelectionOverlay";

const DISPLAY_SIZE = 480;
/** Drag snaps to the canvas center inside this many display pixels. */
const SNAP_DISTANCE = 6;

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
  const brandsReady = useEditorStore((state) => state.brandsReady);
  const dragRef = useRef<DragState | null>(null);
  const [snapped, setSnapped] = useState<SnappedAxes>({ x: false, y: false });

  const waitingForBrands = spec.icon.type === "brand" && !brandsReady;
  const rendered = useMemo(() => {
    if (waitingForBrands) {
      return { uri: null, error: "Loading brand icons..." };
    }
    try {
      return { uri: svgToDataUri(buildIconSvg(spec)), error: null };
    } catch (error) {
      return { uri: null, error: error instanceof Error ? error.message : "Invalid icon spec" };
    }
  }, [spec, waitingForBrands]);

  const scaleToCanvas = spec.canvasSize / DISPLAY_SIZE;
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
    <div
      className="flex h-full flex-col items-center justify-center gap-3 p-8"
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
        className="checkerboard relative cursor-move touch-none select-none rounded-xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
        style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }}
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
            <img
              src={rendered.uri}
              alt="Generated icon preview"
              draggable={false}
              className="h-full w-full"
            />
            {snapped.x ? (
              <div className="-translate-x-1/2 pointer-events-none absolute inset-y-0 left-1/2 w-px bg-primary/80" />
            ) : null}
            {snapped.y ? (
              <div className="-translate-y-1/2 pointer-events-none absolute inset-x-0 top-1/2 h-px bg-primary/80" />
            ) : null}
            {selected ? <SelectionOverlay displaySize={DISPLAY_SIZE} /> : null}
          </>
        ) : (
          <div
            className={`flex h-full items-center justify-center p-8 text-center text-sm ${
              waitingForBrands ? "text-muted-foreground" : "text-destructive"
            }`}
          >
            {rendered.error}
          </div>
        )}
      </div>
      <span className="font-mono text-xs text-muted-foreground">
        {spec.canvasSize} × {spec.canvasSize}
      </span>
    </div>
  );
}
