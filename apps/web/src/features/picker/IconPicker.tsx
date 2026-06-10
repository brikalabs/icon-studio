import { Button } from "@brika/clay/components/button";
import { ButtonGroup } from "@brika/clay/components/button-group";
import { Input } from "@brika/clay/components/input";
import { Kbd } from "@brika/clay/components/kbd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@brika/clay/components/select";
import { toast } from "@brika/clay/components/toast";
import {
  getIconGlyph,
  type IconifyCollection,
  iconLibraries,
  iconLibraryIdSchema,
  isIconifyIconMissing,
  isIconLibraryReady,
  listIconifyCollectionIcons,
  searchIconifyIcons,
  searchIcons,
} from "@brika/icon-studio-core";
import { ArrowLeft, Shuffle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SEARCH_INPUT_ID } from "../../lib/shortcuts";
import { useEditorStore } from "../../state/editor-store";
import { CollectionList } from "./CollectionList";
import { CustomSvgDropzone } from "./CustomSvgDropzone";
import { IconGrid } from "./IconGrid";
import { TextIconInput } from "./TextIconInput";

export function IconPicker() {
  const [query, setQuery] = useState("");
  const library = useEditorStore((state) => state.pickerLibrary);
  const setLibrary = useEditorStore((state) => state.setPickerLibrary);
  const spec = useEditorStore((state) => state.spec);
  const updateSpec = useEditorStore((state) => state.updateSpec);
  const markUndoBoundary = useEditorStore((state) => state.markUndoBoundary);
  const catalogueVersion = useEditorStore((state) => state.catalogueVersion);
  const loadLibrary = useEditorStore((state) => state.loadLibrary);
  const loadIconifyIcons = useEditorStore((state) => state.loadIconifyIcons);

  const [collection, setCollection] = useState<IconifyCollection | null>(null);
  const [collectionIcons, setCollectionIcons] = useState<readonly string[]>([]);
  const [remoteNames, setRemoteNames] = useState<readonly string[]>([]);
  const [remoteSearching, setRemoteSearching] = useState(false);

  // Tab switches clear navigation state so each tab starts at its root view.
  const switchLibrary = (next: string) => {
    const parsed = iconLibraryIdSchema.safeParse(next);
    if (parsed.success) {
      setLibrary(parsed.data);
      void loadLibrary(parsed.data);
      setQuery("");
      setCollection(null);
    }
  };

  const openCollection = (next: IconifyCollection) => {
    setCollection(next);
    setCollectionIcons([]);
    setQuery("");
    listIconifyCollectionIcons(next.prefix)
      .then(setCollectionIcons)
      .catch(() => {
        toast.error(`Could not load ${next.name}`);
        setCollection(null);
      });
  };

  // Global Iconify search (debounced), prefetching result glyphs.
  useEffect(() => {
    if (library !== "iconify" || collection !== null) {
      return;
    }
    if (query.trim() === "") {
      setRemoteNames([]);
      return;
    }
    setRemoteSearching(true);
    const handle = window.setTimeout(async () => {
      try {
        const found = await searchIconifyIcons(query, 120);
        await loadIconifyIcons(found);
        setRemoteNames(found);
      } catch {
        toast.error("Icon search failed, check your connection");
      } finally {
        setRemoteSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(handle);
  }, [library, query, collection, loadIconifyIcons]);

  // Browsing a collection streams glyphs in as rows scroll into view.
  const fetchVisible = useCallback(
    (visible: readonly string[]) => {
      const missing = visible.filter(
        (name) => !getIconGlyph("iconify", name) && !isIconifyIconMissing(name),
      );
      if (missing.length > 0) {
        void loadIconifyIcons(missing);
      }
    },
    [loadIconifyIcons],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies(catalogueVersion): the catalogues live outside React; the version bumping is what makes searchIcons return a lazy library's results
  const names = useMemo<readonly string[]>(() => {
    if (library !== "iconify") {
      return searchIcons(library, query);
    }
    if (collection) {
      const needle = query.trim().toLowerCase();
      return needle
        ? collectionIcons.filter((name) => name.slice(name.indexOf(":") + 1).includes(needle))
        : collectionIcons;
    }
    return remoteNames;
  }, [library, query, collection, collectionIcons, remoteNames, catalogueVersion]);

  const selectedName = spec.icon.type === library ? spec.icon.name : null;

  const pickIcon = (name: string) => {
    markUndoBoundary();
    updateSpec({ icon: { type: library, name } });
  };

  const pickRandom = () => {
    const pool = library === "iconify" && !collection && names.length === 0 ? [] : names;
    const name = pool[Math.floor(Math.random() * pool.length)];
    if (name) {
      pickIcon(name);
    }
  };

  const browsingCollections = library === "iconify" && collection === null && query.trim() === "";

  const emptyMessage = (() => {
    if (library === "iconify") {
      if (collection && collectionIcons.length === 0) {
        return "Loading icons...";
      }
      if (remoteSearching) {
        return "Searching...";
      }
      return `No icons match "${query}"`;
    }
    return isIconLibraryReady(library) ? `No icons match "${query}"` : "Loading icons...";
  })();

  const searchPlaceholder = (() => {
    if (library !== "iconify") {
      return "Search...";
    }
    if (collection) {
      return `Search ${collection.name}...`;
    }
    return "Search all icons...";
  })();

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 p-3 pb-2">
        {/* Library, search, and shuffle joined into one control */}
        <ButtonGroup>
          <Select value={library} onValueChange={switchLibrary}>
            <SelectTrigger className="w-fit shrink-0 font-medium text-xs" aria-label="Icon library">
              <SelectValue>
                {iconLibraries.find((entry) => entry.id === library)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {iconLibraries.map((entry, index) => (
                <SelectItem key={entry.id} value={entry.id}>
                  <span className="flex w-full items-center justify-between gap-3">
                    {entry.label}
                    <Kbd>{index + 1}</Kbd>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            id={SEARCH_INPUT_ID}
            type="search"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search icons"
            className="min-w-0 flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={pickRandom}
            aria-label="Pick a random icon"
            title="Random icon"
          >
            <Shuffle className="size-3.5" />
          </Button>
        </ButtonGroup>
        {collection ? (
          <button
            type="button"
            onClick={() => {
              setCollection(null);
              setQuery("");
            }}
            className="flex items-center gap-1.5 rounded-md px-1 py-0.5 text-muted-foreground text-xs transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1"
          >
            <ArrowLeft className="size-3.5 shrink-0" />
            <span className="truncate font-medium">{collection.name}</span>
            <span className="ml-auto shrink-0 tabular-nums">
              {collection.total.toLocaleString("en")} icons
            </span>
          </button>
        ) : null}
      </div>

      {browsingCollections ? (
        <CollectionList onOpen={openCollection} />
      ) : (
        <IconGrid
          library={library}
          names={names}
          selectedName={selectedName}
          onPick={pickIcon}
          onVisibleNames={library === "iconify" ? fetchVisible : undefined}
          emptyMessage={emptyMessage}
        />
      )}

      <div className="flex flex-col gap-1.5 border-t p-3">
        <TextIconInput />
        <CustomSvgDropzone />
      </div>
    </div>
  );
}
