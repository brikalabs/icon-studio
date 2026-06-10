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
  type IconLibraryId,
  iconLibraries,
  isIconLibraryReady,
  searchIcons,
} from "@brika/icon-studio-core";
import { Copy, Crosshair, Download, Link, Redo2, Shuffle, Undo2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { IconGlyph } from "../../components/IconGlyph";
import { backgroundToCss } from "../../lib/gradient-css";
import { useExportActions } from "../../lib/use-export-actions";
import { useEditorStore } from "../../state/editor-store";

const ICONS_PER_LIBRARY = 4;

interface IconMatch {
  readonly library: IconLibraryId;
  readonly label: string;
  readonly name: string;
}

/**
 * Cmd/Ctrl+K palette: quick icon search across the loaded libraries, export
 * and history actions, and preset switching, all without leaving the keyboard.
 */
export function CommandPalette() {
  const open = useEditorStore((state) => state.paletteOpen);
  const setOpen = useEditorStore((state) => state.setPaletteOpen);
  const catalogueVersion = useEditorStore((state) => state.catalogueVersion);
  const updateSpec = useEditorStore((state) => state.updateSpec);
  const markUndoBoundary = useEditorStore((state) => state.markUndoBoundary);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const exportActions = useExportActions();
  const [query, setQuery] = useState("");

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
    }
  }, [open]);

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

  const pickRandomIcon = () => {
    const names = searchIcons("lucide", "");
    const name = names[Math.floor(Math.random() * names.length)];
    if (name) {
      updateSpec({ icon: { type: "lucide", name } });
    }
  };

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

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(exportActions.download)}>
            <Download />
            Export SVG
          </CommandItem>
          <CommandItem onSelect={() => run(() => void exportActions.copySvg())}>
            <Copy />
            Copy SVG
          </CommandItem>
          <CommandItem onSelect={() => run(() => void exportActions.copyLink())}>
            <Link />
            Copy share link
          </CommandItem>
          <CommandItem onSelect={() => run(undo)}>
            <Undo2 />
            Undo
          </CommandItem>
          <CommandItem onSelect={() => run(redo)}>
            <Redo2 />
            Redo
          </CommandItem>
          <CommandItem onSelect={() => boundaryRun(pickRandomIcon)}>
            <Shuffle />
            Random icon
          </CommandItem>
          <CommandItem
            onSelect={() => boundaryRun(() => updateSpec({ offsetX: 0, offsetY: 0, rotation: 0 }))}
          >
            <Crosshair />
            Reset icon transform
          </CommandItem>
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
