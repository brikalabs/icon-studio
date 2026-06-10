import { Button } from "@brika/clay/components/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@brika/clay/components/input-group";
import { ToggleGroup, ToggleGroupItem } from "@brika/clay/components/toggle-group";
import { cn } from "@brika/clay/primitives";
import {
  type IconLibraryId,
  iconLibraries,
  iconLibraryIdSchema,
  isIconLibraryReady,
  searchIcons,
} from "@brika/icon-studio-core";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, Shuffle } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { IconGlyph } from "../../components/IconGlyph";
import { useEditorStore } from "../../state/editor-store";
import { CustomSvgDropzone } from "./CustomSvgDropzone";

const COLUMNS = 4;
const ROW_HEIGHT = 64;

export function IconPicker() {
  const [query, setQuery] = useState("");
  const [library, setLibrary] = useState<IconLibraryId>("lucide");
  const spec = useEditorStore((state) => state.spec);
  const updateSpec = useEditorStore((state) => state.updateSpec);
  const markUndoBoundary = useEditorStore((state) => state.markUndoBoundary);
  const catalogueVersion = useEditorStore((state) => state.catalogueVersion);
  const loadLibrary = useEditorStore((state) => state.loadLibrary);

  // biome-ignore lint/correctness/useExhaustiveDependencies(catalogueVersion): the catalogues live outside React; the version bumping is what makes searchIcons return a lazy library's results
  const names = useMemo(() => searchIcons(library, query), [library, query, catalogueVersion]);
  const selectedName = spec.icon.type === library ? spec.icon.name : null;

  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: Math.ceil(names.length / COLUMNS),
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 6,
  });

  const pickIcon = (name: string) => {
    markUndoBoundary();
    updateSpec({ icon: { type: library, name } });
  };

  const pickRandom = () => {
    const name = names[Math.floor(Math.random() * names.length)];
    if (name) {
      pickIcon(name);
    }
  };

  const switchLibrary = (next: string) => {
    const parsed = iconLibraryIdSchema.safeParse(next);
    if (parsed.success) {
      setLibrary(parsed.data);
      void loadLibrary(parsed.data);
      virtualizer.scrollToIndex(0);
    }
  };

  const loadingLibrary = !isIconLibraryReady(library);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 p-3">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          className="w-full"
          value={library}
          onValueChange={switchLibrary}
          aria-label="Icon library"
        >
          {iconLibraries.map((entry) => (
            <ToggleGroupItem key={entry.id} value={entry.id} className="flex-1">
              {entry.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="flex items-center gap-2">
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Search className="size-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              placeholder="Search icons..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search icons"
            />
          </InputGroup>
          <Button
            variant="outline"
            size="icon"
            onClick={pickRandom}
            aria-label="Pick a random icon"
            title="Random icon"
          >
            <Shuffle />
          </Button>
        </div>
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {names.length === 0 ? (
          <p className="px-1 py-8 text-center text-sm text-muted-foreground">
            {loadingLibrary ? "Loading icons..." : `No icons match "${query}"`}
          </p>
        ) : (
          <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((row) => (
              <div
                key={row.key}
                className="absolute inset-x-0 grid grid-cols-4 gap-2"
                style={{ top: 0, height: row.size, transform: `translateY(${row.start}px)` }}
              >
                {names.slice(row.index * COLUMNS, row.index * COLUMNS + COLUMNS).map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => pickIcon(name)}
                    title={name}
                    aria-label={name}
                    aria-pressed={name === selectedName}
                    className={cn(
                      "flex items-center justify-center rounded-lg border text-foreground/80 transition-colors",
                      name === selectedName
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-transparent bg-card hover:border-border hover:text-foreground",
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
      <div className="border-t p-3">
        <CustomSvgDropzone />
      </div>
    </div>
  );
}
