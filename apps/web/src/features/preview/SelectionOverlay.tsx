import { RotateCw } from "lucide-react";
import { useEditorStore } from "../../state/editor-store";

interface SelectionOverlayProps {
  readonly displaySize: number;
}

const CORNERS = [
  { id: "nw", x: 0, y: 0, cursor: "nwse-resize" },
  { id: "ne", x: 1, y: 0, cursor: "nesw-resize" },
  { id: "sw", x: 0, y: 1, cursor: "nesw-resize" },
  { id: "se", x: 1, y: 1, cursor: "nwse-resize" },
] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * On-canvas transform handles drawn over the preview: corner dots resize the
 * icon (distance from its center), the top handle rotates it (shift snaps to
 * 15° steps). The box itself tracks offset, scale, and rotation live.
 */
export function SelectionOverlay({ displaySize }: Readonly<SelectionOverlayProps>) {
  const spec = useEditorStore((state) => state.spec);
  const updateSpec = useEditorStore((state) => state.updateSpec);
  const markUndoBoundary = useEditorStore((state) => state.markUndoBoundary);

  const toDisplay = displaySize / spec.canvasSize;
  const boxSize = displaySize * spec.iconScale;
  const center = {
    x: displaySize / 2 + spec.offsetX * toDisplay,
    y: displaySize / 2 + spec.offsetY * toDisplay,
  };

  /** Center of the icon in viewport coordinates, from any event inside the overlay. */
  const centerInViewport = (overlay: HTMLElement) => {
    const rect = overlay.getBoundingClientRect();
    return { x: rect.left + center.x, y: rect.top + center.y };
  };

  const beginDrag = (
    event: React.PointerEvent<HTMLButtonElement>,
    onMove: (
      pointer: { x: number; y: number },
      origin: { x: number; y: number },
      shift: boolean,
    ) => void,
  ) => {
    const overlay = event.currentTarget.closest("[data-overlay]");
    if (!(overlay instanceof HTMLElement)) {
      return;
    }
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    markUndoBoundary();
    const origin = centerInViewport(overlay);
    const move = (pointer: PointerEvent) =>
      onMove({ x: pointer.clientX, y: pointer.clientY }, origin, pointer.shiftKey);
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  const resizeFrom = (pointer: { x: number; y: number }, origin: { x: number; y: number }) => {
    const distance = Math.hypot(pointer.x - origin.x, pointer.y - origin.y);
    const halfDiagonalAtScaleOne = (displaySize / 2) * Math.SQRT2;
    updateSpec({
      iconScale: clamp(Number((distance / halfDiagonalAtScaleOne).toFixed(2)), 0.05, 1.5),
    });
  };

  const rotateFrom = (
    pointer: { x: number; y: number },
    origin: { x: number; y: number },
    shift: boolean,
  ) => {
    const degrees = (Math.atan2(pointer.y - origin.y, pointer.x - origin.x) * 180) / Math.PI + 90;
    const normalized = (Math.round(degrees) + 360) % 360;
    updateSpec({ rotation: shift ? (Math.round(normalized / 15) * 15) % 360 : normalized });
  };

  return (
    <div data-overlay className="pointer-events-none absolute inset-0">
      <div
        className="absolute"
        style={{
          left: center.x - boxSize / 2,
          top: center.y - boxSize / 2,
          width: boxSize,
          height: boxSize,
          transform: `rotate(${spec.rotation}deg)`,
        }}
      >
        <div className="absolute inset-0 rounded-sm border border-white/40" />

        <button
          type="button"
          aria-label="Rotate icon"
          title="Drag to rotate (shift snaps to 15°)"
          className="-top-9 -translate-x-1/2 pointer-events-auto absolute left-1/2 flex size-6 cursor-grab items-center justify-center rounded-full border border-white/60 bg-black/50 text-white/90 backdrop-blur-sm"
          onPointerDown={(event) => beginDrag(event, rotateFrom)}
        >
          <RotateCw className="size-3.5" />
        </button>
        <div className="-translate-x-1/2 -top-3 absolute left-1/2 h-3 w-px bg-white/40" />

        {CORNERS.map((corner) => (
          <button
            key={corner.id}
            type="button"
            aria-label={`Resize icon (${corner.id} corner)`}
            className="-translate-x-1/2 -translate-y-1/2 pointer-events-auto absolute size-3 rounded-full border border-black/40 bg-white shadow"
            style={{
              left: `${corner.x * 100}%`,
              top: `${corner.y * 100}%`,
              cursor: corner.cursor,
            }}
            onPointerDown={(event) => beginDrag(event, resizeFrom)}
          />
        ))}
      </div>
    </div>
  );
}
