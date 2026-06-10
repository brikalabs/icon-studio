/** Shared between the global key handler in App and the About dialog list. */

export const SEARCH_INPUT_ID = "icon-search";

/**
 * The handlers accept both metaKey and ctrlKey, so shortcuts work everywhere;
 * these tokens make the DISPLAY match the platform (⌘/⇧ on Apple, Ctrl/Shift
 * elsewhere).
 */
const isApplePlatform =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);
export const MOD_KEY = isApplePlatform ? "⌘" : "Ctrl";
export const SHIFT_KEY = isApplePlatform ? "⇧" : "Shift";

export interface ShortcutEntry {
  readonly keys: readonly string[];
  readonly description: string;
}

export const KEYBOARD_SHORTCUTS: readonly ShortcutEntry[] = [
  { keys: [MOD_KEY, "K"], description: "Command palette" },
  { keys: [MOD_KEY, "Z"], description: "Undo" },
  { keys: [SHIFT_KEY, MOD_KEY, "Z"], description: "Redo" },
  { keys: [MOD_KEY, "S"], description: "Export SVG" },
  { keys: [SHIFT_KEY, MOD_KEY, "C"], description: "Copy SVG markup" },
  { keys: ["1", "3"], description: "Switch icon library (1 to 3)" },
  { keys: ["/"], description: "Focus icon search" },
  { keys: ["M"], description: "Cycle preview mask" },
  { keys: ["↑↓←→"], description: "Nudge icon by 1 px (canvas focused), Shift for 10 px" },
  { keys: ["Esc"], description: "Deselect icon" },
];

export const CANVAS_TIPS: readonly string[] = [
  "Click the icon to select it, then drag to move; it snaps to the center.",
  "Corner handles resize; the top handle rotates (Shift snaps to 15°).",
  "Double-click the canvas to re-center the icon.",
];
