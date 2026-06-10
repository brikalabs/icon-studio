import { getIconNames, getIconTerms } from "./libraries";
import type { IconLibraryId } from "./types";

/**
 * Name-and-keyword substring search over one icon library.
 * Ranks name prefixes first, then name substrings, then keyword matches
 * (lucide tags, brand titles). An empty query returns the library's
 * full catalogue. Lazy libraries return nothing until ensureIconLibrary
 * has resolved.
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
    } else if (getIconTerms(library, name).some((term) => term.includes(needle))) {
      matches.push({ name, rank: 2 });
    }
  }
  matches.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
  return matches.slice(0, end).map((match) => match.name);
}
