import { buildIconSvg } from "@brika/icon-studio-core";
import { useMemo, useRef } from "react";
import { svgToDataUri } from "../../lib/svg-io";
import { useEditorStore } from "../../state/editor-store";

const DISPLAY_SIZE = 480;

interface DragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startOffsetX: number;
  startOffsetY: number;
}

/**
 * Renders the composed SVG through an <img data-uri>, so the preview is the
 * exact artifact the exporter produces. Dragging (or arrow keys) moves the
 * icon layer; movement is mapped from screen pixels to canvas pixels.
 */
export function PreviewCanvas() {
  const spec = useEditorStore((state) => state.spec);
  const updateSpec = useEditorStore((state) => state.updateSpec);
  const markUndoBoundary = useEditorStore((state) => state.markUndoBoundary);
  const dragRef = useRef<DragState | null>(null);

  const rendered = useMemo(() => {
    try {
      return { uri: svgToDataUri(buildIconSvg(spec)), error: null };
    } catch (error) {
      return { uri: null, error: error instanceof Error ? error.message : "Invalid icon spec" };
    }
  }, [spec]);

  const scaleToCanvas = spec.canvasSize / DISPLAY_SIZE;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
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
    updateSpec({
      offsetX: Math.round(drag.startOffsetX + (event.clientX - drag.startClientX) * scaleToCanvas),
      offsetY: Math.round(drag.startOffsetY + (event.clientY - drag.startClientY) * scaleToCanvas),
    });
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
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
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
      <div
        role="application"
        aria-label="Icon preview. Drag or use arrow keys to move the icon."
        // biome-ignore lint/a11y/noNoninteractiveTabindex: this is a 2D drag surface with pointer and arrow-key handlers; it must be focusable for the keyboard interaction
        tabIndex={0}
        className="checkerboard cursor-move touch-none select-none rounded-xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
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
          <img
            src={rendered.uri}
            alt="Generated icon preview"
            draggable={false}
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center text-sm text-destructive">
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
