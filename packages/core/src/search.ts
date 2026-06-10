import { getBrandIcon, getBrandIconNames } from "./brands";
import { getLucideIconTags, lucideIconNames } from "./lucide";

export type IconLibraryId = "lucide" | "brand";

export interface IconLibraryInfo {
  readonly id: IconLibraryId;
  readonly label: string;
}

/** The searchable icon libraries, in display order. */
export const iconLibraries: readonly IconLibraryInfo[] = [
  { id: "lucide", label: "Icons" },
  { id: "brand", label: "Brands" },
];

/** Brand names are empty until `ensureBrandIcons()` has resolved. */
export function getIconNames(library: IconLibraryId): readonly string[] {
  return library === "lucide" ? lucideIconNames : getBrandIconNames();
}

function searchTerms(library: IconLibraryId, name: string): readonly string[] {
  if (library === "lucide") {
    return getLucideIconTags(name);
  }
  const brand = getBrandIcon(name);
  return brand ? [brand.title.toLowerCase()] : [];
}

/**
 * Name-and-keyword substring search over one icon library.
 * Ranks name prefixes first, then name substrings, then keyword matches.
 * An empty query returns the library's full catalogue.
 */
export function searchIcons(
  library: IconLibraryId,
  query: string,
  limit = Number.POSITIVE_INFINITY,
): string[] {
  const catalogue = getIconNames(library);
  const end = limit === Number.POSITIVE_INFINITY ? undefined : limit;
  const needle = query.trim().toLowerCase();
  if (needle === "") {
    return catalogue.slice(0, end);
  }
  const matches: { name: string; rank: number }[] = [];
  for (const name of catalogue) {
    if (name.includes(needle)) {
      matches.push({ name, rank: name.startsWith(needle) ? 0 : 1 });
    } else if (searchTerms(library, name).some((term) => term.includes(needle))) {
      matches.push({ name, rank: 2 });
    }
  }
  matches.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
  return matches.slice(0, end).map((match) => match.name);
}
