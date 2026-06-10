import type { Background } from "./types";

export interface BackgroundPreset {
  readonly id: string;
  readonly background: Background;
}

/** Curated background presets shown in the editor and addressable from the CLI. */
export const backgroundPresets: readonly BackgroundPreset[] = [
  { id: "raycast", background: { type: "linear", from: "#3F5EFB", to: "#FC466B", angle: 45 } },
  { id: "berry", background: { type: "linear", from: "#8E2DE2", to: "#4A00E0", angle: 45 } },
  { id: "sunset", background: { type: "linear", from: "#FF512F", to: "#F09819", angle: 45 } },
  { id: "ocean", background: { type: "linear", from: "#2193B0", to: "#6DD5ED", angle: 45 } },
  { id: "forest", background: { type: "linear", from: "#11998E", to: "#38EF7D", angle: 45 } },
  { id: "grape", background: { type: "linear", from: "#7F00FF", to: "#E100FF", angle: 45 } },
  { id: "flamingo", background: { type: "linear", from: "#F83600", to: "#F9D423", angle: 45 } },
  { id: "sky", background: { type: "linear", from: "#2F80ED", to: "#56CCF2", angle: 45 } },
  { id: "gold", background: { type: "linear", from: "#F7971E", to: "#FFD200", angle: 45 } },
  { id: "mint", background: { type: "linear", from: "#00B09B", to: "#96C93D", angle: 45 } },
  { id: "blush", background: { type: "linear", from: "#DD5E89", to: "#F7BBA7", angle: 45 } },
  { id: "steel", background: { type: "linear", from: "#29323C", to: "#485563", angle: 45 } },
  { id: "midnight", background: { type: "linear", from: "#232526", to: "#414345", angle: 45 } },
  { id: "ember", background: { type: "radial", from: "#F27121", to: "#8A2387" } },
  { id: "graphite", background: { type: "solid", color: "#18181B" } },
  { id: "paper", background: { type: "solid", color: "#F4F4F5" } },
];

export function getBackgroundPreset(id: string): BackgroundPreset | undefined {
  return backgroundPresets.find((preset) => preset.id === id);
}
