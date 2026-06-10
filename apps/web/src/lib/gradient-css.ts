import type { Background, GradientStop } from "@brika/icon-studio-core";

/** `color offset%` segments, sorted by offset, for a CSS gradient stop list. */
export function stopsToCss(stops: readonly GradientStop[]): string {
  return [...stops]
    .sort((a, b) => a.offset - b.offset)
    .map((stop) => `${stop.color} ${stop.offset * 100}%`)
    .join(", ");
}

/** A `background` CSS value for the editor previews, matching the SVG output. */
export function backgroundToCss(background: Background): string {
  switch (background.type) {
    case "solid":
      return background.color;
    case "linear":
      return `linear-gradient(${background.angle}deg, ${stopsToCss(background.stops)})`;
    case "radial":
      return `radial-gradient(circle at ${background.cx * 100}% ${background.cy * 100}%, ${stopsToCss(background.stops)})`;
  }
}
