/** Shared between the global key handler in App and the About dialog list. */

export const SEARCH_INPUT_ID = "icon-search";

export interface ShortcutEntry {
  readonly keys: readonly string[];
  readonly description: string;
}

export const KEYBOARD_SHORTCUTS: readonly ShortcutEntry[] = [
  { keys: ["⌘", "K"], description: "Command palette" },
  { keys: ["⌘", "Z"], description: "Undo" },
  { keys: ["⇧", "⌘", "Z"], description: "Redo" },
  { keys: ["⌘", "S"], description: "Export SVG" },
  { keys: ["⇧", "⌘", "C"], description: "Copy SVG markup" },
  { keys: ["1", "3"], description: "Switch icon library (1 to 3)" },
  { keys: ["/"], description: "Focus icon search" },
  { keys: ["M"], description: "Cycle preview mask" },
  { keys: ["↑↓←→"], description: "Nudge icon by 1 px (canvas focused), ⇧ for 10 px" },
  { keys: ["Esc"], description: "Deselect icon" },
];

export const CANVAS_TIPS: readonly string[] = [
  "Click the icon to select it, then drag to move; it snaps to the center.",
  "Corner handles resize; the top handle rotates (⇧ snaps to 15°).",
  "Double-click the canvas to re-center the icon.",
];
