import { Badge } from "@brika/clay/components/badge";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@brika/clay/components/command";
import {
  backgroundPresets,
  ensureIconifyIcons,
  type IconLibraryId,
  iconLibraries,
  isIconLibraryReady,
  searchIconifyIcons,
  searchIcons,
} from "@brika/icon-studio-core";
import {
  Copy,
  Crosshair,
  Dices,
  Download,
  FilePlus2,
  LibraryBig,
  Link,
  Redo2,
  Undo2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { IconGlyph } from "../../components/IconGlyph";
import { backgroundToCss } from "../../lib/gradient-css";
import {
  copyShareLink,
  copySvg,
  exportSvg,
  randomizeSpec,
  startFresh,
} from "../../lib/spec-actions";
import { useEditorStore } from "../../state/editor-store";

const ICONS_PER_LIBRARY = 4;
const ICONIFY_RESULTS = 8;

interface IconMatch {
  readonly library: IconLibraryId;
  readonly label: string;
  readonly name: string;
}

/**
 * Cmd/Ctrl+K palette: quick icon search across the loaded libraries plus the
 * Iconify universe, library navigation, presets, and every editor action,
 * all without leaving the keyboard.
 */
export function CommandPalette() {
  const open = useEditorStore((state) => state.paletteOpen);
  const setOpen = useEditorStore((state) => state.setPaletteOpen);
  const catalogueVersion = useEditorStore((state) => state.catalogueVersion);
  const updateSpec = useEditorStore((state) => state.updateSpec);
  const markUndoBoundary = useEditorStore((state) => state.markUndoBoundary);
  const setPickerLibrary = useEditorStore((state) => state.setPickerLibrary);
  const loadLibrary = useEditorStore((state) => state.loadLibrary);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const [query, setQuery] = useState("");
  const [iconifyMatches, setIconifyMatches] = useState<readonly string[]>([]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!useEditorStore.getState().paletteOpen);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setIconifyMatches([]);
    }
  }, [open]);

  // Iconify results stream in beside the local matches (debounced, best effort).
  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setIconifyMatches([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      try {
        const found = await searchIconifyIcons(query, ICONIFY_RESULTS);
        await ensureIconifyIcons(found);
        setIconifyMatches(found);
      } catch {
        setIconifyMatches([]);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [open, query]);

  // biome-ignore lint/correctness/useExhaustiveDependencies(catalogueVersion): catalogues live outside React; the version bump adds freshly loaded libraries to the results
  const iconMatches = useMemo<IconMatch[]>(() => {
    if (query.trim() === "") {
      return [];
    }
    return iconLibraries
      .filter((library) => library.id !== "iconify" && isIconLibraryReady(library.id))
      .flatMap((library) =>
        searchIcons(library.id, query, ICONS_PER_LIBRARY).map((name) => ({
          library: library.id,
          label: library.label,
          name,
        })),
      );
  }, [query, catalogueVersion]);

  const run = (action: () => void) => {
    action();
    setOpen(false);
  };

  const boundaryRun = (action: () => void) =>
    run(() => {
      markUndoBoundary();
      action();
    });

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search icons, presets, and commands..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Nothing found.</CommandEmpty>

        {iconMatches.length > 0 ? (
          <CommandGroup heading="Icons">
            {iconMatches.map((match) => (
              <CommandItem
                key={`${match.library}:${match.name}`}
                value={`${match.name} ${match.label}`}
                onSelect={() =>
                  boundaryRun(() => updateSpec({ icon: { type: match.library, name: match.name } }))
                }
              >
                <IconGlyph library={match.library} name={match.name} size={16} />
                {match.name}
                <Badge variant="secondary" className="ml-auto">
                  {match.label}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {iconifyMatches.length > 0 ? (
          <CommandGroup heading="All icons (Iconify)">
            {iconifyMatches.map((name) => (
              <CommandItem
                key={`iconify:${name}`}
                value={`${name} iconify`}
                onSelect={() => boundaryRun(() => updateSpec({ icon: { type: "iconify", name } }))}
              >
                <IconGlyph library="iconify" name={name} size={16} />
                {name}
                <Badge variant="secondary" className="ml-auto">
                  Iconify
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(exportSvg)}>
            <Download />
            Export SVG
          </CommandItem>
          <CommandItem onSelect={() => run(() => void copySvg())}>
            <Copy />
            Copy SVG
          </CommandItem>
          <CommandItem onSelect={() => run(() => void copyShareLink())}>
            <Link />
            Copy share link
          </CommandItem>
          <CommandItem onSelect={() => run(randomizeSpec)} value="randomize surprise random design">
            <Dices />
            Randomize everything
          </CommandItem>
          <CommandItem onSelect={() => run(startFresh)} value="start fresh reset everything new">
            <FilePlus2 />
            Start fresh
          </CommandItem>
          <CommandItem onSelect={() => run(undo)}>
            <Undo2 />
            Undo
          </CommandItem>
          <CommandItem onSelect={() => run(redo)}>
            <Redo2 />
            Redo
          </CommandItem>
          <CommandItem
            onSelect={() => boundaryRun(() => updateSpec({ offsetX: 0, offsetY: 0, rotation: 0 }))}
          >
            <Crosshair />
            Reset icon transform
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Browse">
          {iconLibraries.map((library) => (
            <CommandItem
              key={`browse-${library.id}`}
              value={`browse ${library.label} library`}
              onSelect={() =>
                run(() => {
                  setPickerLibrary(library.id);
                  void loadLibrary(library.id);
                })
              }
            >
              <LibraryBig />
              Browse {library.label === "All" ? "all icons" : `${library.label} icons`}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Presets">
          {backgroundPresets.map((preset) => (
            <CommandItem
              key={preset.id}
              value={`preset ${preset.id}`}
              onSelect={() => boundaryRun(() => updateSpec({ background: preset.background }))}
            >
              <span
                aria-hidden="true"
                className="size-4 rounded-sm border border-border/50"
                style={{ background: backgroundToCss(preset.background) }}
              />
              {preset.id}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
