import { cn } from "@brika/clay/primitives";
import type { IconLibraryId } from "@brika/icon-studio-core";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import { IconGlyph } from "../../components/IconGlyph";

const COLUMNS = 4;
const ROW_HEIGHT = 60;

interface IconGridProps {
  readonly library: IconLibraryId;
  readonly names: readonly string[];
  readonly selectedName: string | null;
  readonly onPick: (name: string) => void;
  /** Fires with the names scrolled into view, for on-demand glyph fetching. */
  readonly onVisibleNames?: (names: readonly string[]) => void;
  readonly emptyMessage: string;
}

/** Virtualized 4-column icon grid shared by every picker view. */
export function IconGrid({
  library,
  names,
  selectedName,
  onPick,
  onVisibleNames,
  emptyMessage,
}: Readonly<IconGridProps>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: Math.ceil(names.length / COLUMNS),
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 6,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const firstRow = virtualRows[0]?.index ?? 0;
  const lastRow = virtualRows.at(-1)?.index ?? 0;

  useEffect(() => {
    if (onVisibleNames && names.length > 0) {
      onVisibleNames(names.slice(firstRow * COLUMNS, (lastRow + 1) * COLUMNS));
    }
  }, [onVisibleNames, names, firstRow, lastRow]);

  // New name lists (library/tab/query changes) start back at the top.
  // biome-ignore lint/correctness/useExhaustiveDependencies(names): the scroll reset must react to content changes, not scroll math
  useEffect(() => {
    virtualizer.scrollToIndex(0);
  }, [names, virtualizer.scrollToIndex]);

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
      {names.length === 0 ? (
        <p className="px-1 py-8 text-center text-muted-foreground text-sm">{emptyMessage}</p>
      ) : (
        <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
          {virtualRows.map((row) => (
            <div
              key={row.key}
              className="absolute inset-x-0 grid grid-cols-4 gap-1.5"
              style={{ top: 0, height: row.size, transform: `translateY(${row.start}px)` }}
            >
              {names.slice(row.index * COLUMNS, row.index * COLUMNS + COLUMNS).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onPick(name)}
                  title={name}
                  aria-label={name}
                  aria-pressed={name === selectedName}
                  className={cn(
                    "flex items-center justify-center rounded-lg transition-all duration-100 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1",
                    name === selectedName
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "text-foreground/70 hover:bg-accent hover:text-foreground",
                  )}
                >
                  <IconGlyph library={library} name={name} />
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
