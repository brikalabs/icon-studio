import { Badge } from "@brika/clay/components/badge";
import { SectionLabel } from "@brika/clay/components/section-label";
import { type IconifyCollection, listIconifyCollections } from "@brika/icon-studio-core";
import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface CollectionListProps {
  readonly onOpen: (collection: IconifyCollection) => void;
}

/** Browsable list of every Iconify set, grouped by category, like icones.js.org. */
export function CollectionList({ onOpen }: Readonly<CollectionListProps>) {
  const [collections, setCollections] = useState<readonly IconifyCollection[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    listIconifyCollections()
      .then(setCollections)
      .catch(() => setFailed(true));
  }, []);

  const groups = useMemo(() => {
    if (!collections) {
      return [];
    }
    const byCategory = new Map<string, IconifyCollection[]>();
    for (const collection of collections) {
      const list = byCategory.get(collection.category) ?? [];
      list.push(collection);
      byCategory.set(collection.category, list);
    }
    return [...byCategory.entries()].map(([category, entries]) => ({
      category,
      entries: entries.sort((a, b) => b.total - a.total),
    }));
  }, [collections]);

  if (failed) {
    return (
      <p className="px-4 py-8 text-center text-muted-foreground text-sm">
        Could not load collections. Check your connection.
      </p>
    );
  }
  if (!collections) {
    return <p className="px-4 py-8 text-center text-muted-foreground text-sm">Loading sets...</p>;
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
      {groups.map((group) => (
        <section key={group.category} className="flex flex-col gap-0.5 pt-3">
          <SectionLabel>{group.category}</SectionLabel>
          <div className="mt-1 flex flex-col gap-px">
            {group.entries.map((collection) => (
              <button
                key={collection.prefix}
                type="button"
                onClick={() => onOpen(collection)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{collection.name}</span>
                  <span className="block truncate text-muted-foreground text-xs">
                    {collection.prefix}
                    {collection.license ? ` · ${collection.license}` : ""}
                  </span>
                </span>
                <Badge variant="secondary" className="shrink-0 tabular-nums">
                  {collection.total.toLocaleString("en")}
                </Badge>
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
