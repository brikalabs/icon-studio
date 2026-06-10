import { Badge } from "@brika/clay/components/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@brika/clay/components/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@brika/clay/components/dialog";
import { Kbd } from "@brika/clay/components/kbd";
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
  FileImage,
  FilePlus2,
  ImageDown,
  LibraryBig,
  Link,
  Redo2,
  Undo2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { IconGlyph } from "../../components/IconGlyph";
import { ShortcutKeys } from "../../components/ShortcutKeys";
import { backgroundToCss } from "../../lib/gradient-css";
import {
  copyPng,
  copyShareLink,
  copySvg,
  exportPng,
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

  // The open/close shortcut itself lives in the global registry handler (App).
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
    <Dialog open={open} onOpenChange={setOpen}>
      {/* p-safe is not a twMerge-known padding class, so it must be beaten
          with an inline style; the dialog chrome goes transparent so the
          Command surface is the single visible panel (no double frame). */}
      <DialogContent
        className="overflow-hidden border-0 bg-transparent shadow-none backdrop-blur-none sm:max-w-lg"
        style={{ padding: 0 }}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search icons, presets, and commands
        </DialogDescription>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group]]:px-1.5 [&_[cmdk-input]]:h-10 [&_[cmdk-item]]:gap-2 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-1.5 [&_[cmdk-item]_svg]:size-4">
          <CommandInput
            placeholder="Search icons, presets, and commands..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[min(56vh,420px)]">
            <CommandEmpty>Nothing found.</CommandEmpty>

            {iconMatches.length > 0 ? (
              <CommandGroup heading="Icons">
                {iconMatches.map((match) => (
                  <CommandItem
                    key={`${match.library}:${match.name}`}
                    value={`${match.name} ${match.label}`}
                    onSelect={() =>
                      boundaryRun(() =>
                        updateSpec({ icon: { type: match.library, name: match.name } }),
                      )
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
                    onSelect={() =>
                      boundaryRun(() => updateSpec({ icon: { type: "iconify", name } }))
                    }
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
                <CommandShortcut>
                  <ShortcutKeys of="exportSvg" />
                </CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => run(() => void exportPng())} value="export png image">
                <FileImage />
                Export PNG
              </CommandItem>
              <CommandItem onSelect={() => run(() => void copySvg())}>
                <Copy />
                Copy SVG
                <CommandShortcut>
                  <ShortcutKeys of="copySvg" />
                </CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => run(() => void copyPng())} value="copy png image">
                <ImageDown />
                Copy PNG
              </CommandItem>
              <CommandItem onSelect={() => run(() => void copyShareLink())}>
                <Link />
                Copy share link
              </CommandItem>
              <CommandItem
                onSelect={() => run(randomizeSpec)}
                value="randomize surprise random design"
              >
                <Dices />
                Randomize everything
              </CommandItem>
              <CommandItem
                onSelect={() => run(startFresh)}
                value="start fresh reset everything new"
              >
                <FilePlus2 />
                Start fresh
              </CommandItem>
              <CommandItem onSelect={() => run(undo)}>
                <Undo2 />
                Undo
                <CommandShortcut>
                  <ShortcutKeys of="undo" />
                </CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => run(redo)}>
                <Redo2 />
                Redo
                <CommandShortcut>
                  <ShortcutKeys of="redo" />
                </CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  boundaryRun(() => updateSpec({ offsetX: 0, offsetY: 0, rotation: 0 }))
                }
              >
                <Crosshair />
                Reset icon transform
              </CommandItem>
            </CommandGroup>

            <CommandGroup heading="Browse">
              {iconLibraries.map((library, index) => (
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
                  <CommandShortcut>
                    <Kbd>{index + 1}</Kbd>
                  </CommandShortcut>
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
        </Command>
      </DialogContent>
    </Dialog>
  );
}
