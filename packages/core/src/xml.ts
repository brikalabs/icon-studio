const XML_ESCAPES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char] ?? char);
}

/** Renders an attribute object as ` key="value"` pairs, XML-escaped. */
export function serializeAttributes(attributes: Readonly<Record<string, string | number>>): string {
  return Object.entries(attributes)
    .map(([key, value]) => ` ${key}="${escapeXml(String(value))}"`)
    .join("");
}

/** Trims float noise: 146.44699999 -> "146.447", 512 -> "512". */
export function formatNumber(value: number): string {
  return String(Number(value.toFixed(3)));
}
