import { getLucideIconTags, lucideIconNames } from "./lucide";

/**
 * Name-and-tag substring search over the lucide catalogue.
 * Ranks name prefixes first, then name substrings, then tag matches.
 * An empty query returns the full catalogue.
 */
export function searchLucideIcons(query: string, limit = Number.POSITIVE_INFINITY): string[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") {
    return lucideIconNames.slice(0, limit === Number.POSITIVE_INFINITY ? undefined : limit);
  }
  const matches: { name: string; rank: number }[] = [];
  for (const name of lucideIconNames) {
    if (name.includes(needle)) {
      matches.push({ name, rank: name.startsWith(needle) ? 0 : 1 });
    } else if (getLucideIconTags(name).some((tag) => tag.includes(needle))) {
      matches.push({ name, rank: 2 });
    }
  }
  matches.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
  return matches
    .slice(0, limit === Number.POSITIVE_INFINITY ? undefined : limit)
    .map((m) => m.name);
}
