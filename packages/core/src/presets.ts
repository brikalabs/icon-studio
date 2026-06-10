import { type Background, COVER_RADIUS, type GradientStop } from "./types";

export interface BackgroundPreset {
  readonly id: string;
  readonly background: Background;
}

function stops(...colors: readonly string[]): GradientStop[] {
  const last = colors.length - 1;
  return colors.map((color, index) => ({ color, offset: last === 0 ? 0 : index / last }));
}

function linear(id: string, angle: number, ...colors: readonly string[]): BackgroundPreset {
  return { id, background: { type: "linear", stops: stops(...colors), angle } };
}

function radial(id: string, ...colors: readonly string[]): BackgroundPreset {
  return {
    id,
    background: { type: "radial", stops: stops(...colors), cx: 0.5, cy: 0.5, radius: COVER_RADIUS },
  };
}

function solid(id: string, color: string): BackgroundPreset {
  return { id, background: { type: "solid", color } };
}

/** Curated background presets shown in the editor and addressable from the CLI. */
export const backgroundPresets: readonly BackgroundPreset[] = [
  linear("raycast", 45, "#3F5EFB", "#FC466B"),
  linear("berry", 45, "#8E2DE2", "#4A00E0"),
  linear("sunset", 45, "#FF512F", "#F09819"),
  linear("ocean", 45, "#2193B0", "#6DD5ED"),
  linear("forest", 45, "#11998E", "#38EF7D"),
  linear("grape", 45, "#7F00FF", "#E100FF"),
  linear("flamingo", 45, "#F83600", "#F9D423"),
  linear("sky", 45, "#2F80ED", "#56CCF2"),
  linear("gold", 45, "#F7971E", "#FFD200"),
  linear("mint", 45, "#00B09B", "#96C93D"),
  linear("blush", 45, "#DD5E89", "#F7BBA7"),
  linear("aurora", 160, "#00C9FF", "#92FE9D", "#F9F871"),
  linear("dawn", 0, "#0F2027", "#203A43", "#2C5364"),
  linear("nebula", 135, "#7303C0", "#EC38BC", "#FDEFF9"),
  linear("candy", 45, "#FC5C7D", "#6A82FB"),
  linear("citrus", 60, "#FDC830", "#F37335"),
  linear("royal", 30, "#141E30", "#243B55"),
  linear("cherry", 45, "#EB3349", "#F45C43"),
  linear("deepsea", 200, "#2C3E50", "#4CA1AF"),
  linear("lavender", 120, "#9796F0", "#FBC7D4"),
  linear("emerald", 135, "#0F3443", "#34E89E"),
  linear("magma", 25, "#200122", "#6F0000"),
  linear("steel", 45, "#29323C", "#485563"),
  linear("midnight", 45, "#232526", "#414345"),
  radial("ember", "#F27121", "#8A2387"),
  radial("halo", "#56CCF2", "#0B3866"),
  radial("supernova", "#FFD200", "#F7971E", "#411E0E"),
  radial("void", "#434343", "#000000"),
  solid("graphite", "#18181B"),
  solid("indigo", "#4F46E5"),
  solid("crimson", "#DC2626"),
  solid("paper", "#F4F4F5"),
];

export function getBackgroundPreset(id: string): BackgroundPreset | undefined {
  return backgroundPresets.find((preset) => preset.id === id);
}
