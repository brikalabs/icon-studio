import { iconLibraries } from "@brika/icon-studio-core";
import { previewMaskSchema, useEditorStore } from "../state/editor-store";
import { copyShareLink, copySvg, exportSvg, randomizeSpec, startFresh } from "./spec-actions";

/**
 * Single source of truth for keyboard shortcuts. One entry = binding,
 * display, and action: `installShortcuts()` wires the handler, the About
 * dialog lists every entry, and `<ShortcutKeys of="id" />` renders its keys.
 *
 * Adding a shortcut is one literal here:
 *   myAction: { combo: "mod+e", description: "...", run: () => ... }
 */

export const SEARCH_INPUT_ID = "icon-search";

/** Handlers accept ctrl and meta alike; only the DISPLAY is platform-aware. */
const isApplePlatform =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);
export const MOD_KEY = isApplePlatform ? "⌘" : "Ctrl";
export const SHIFT_KEY = isApplePlatform ? "⇧" : "Shift";

interface ShortcutConfig {
  readonly description: string;
  /** "mod+shift+z" style: mod is meta or ctrl; the last part is the key. */
  readonly combo: string;
  /** Extra accepted combos, never displayed (e.g. the Windows redo "mod+y"). */
  readonly aliases?: readonly string[];
  /** Fires even when an input/textarea has focus. */
  readonly worksInInputs?: boolean;
  readonly run: () => void;
}

/** Identity helper: enforces the shape while keeping the literal key union. */
function defineShortcuts<T extends Record<string, ShortcutConfig>>(
  shortcuts: T,
): Readonly<Record<keyof T, ShortcutConfig>> {
  return shortcuts;
}

export const SHORTCUTS = defineShortcuts({
  palette: {
    description: "Command palette",
    combo: "mod+k",
    worksInInputs: true,
    run: () => {
      const store = useEditorStore.getState();
      store.setPaletteOpen(!store.paletteOpen);
    },
  },
  undo: {
    description: "Undo",
    combo: "mod+z",
    run: () => useEditorStore.getState().undo(),
  },
  redo: {
    description: "Redo",
    combo: "mod+shift+z",
    aliases: ["mod+y"],
    run: () => useEditorStore.getState().redo(),
  },
  exportSvg: {
    description: "Export SVG",
    combo: "mod+s",
    worksInInputs: true,
    run: exportSvg,
  },
  copySvg: {
    description: "Copy SVG markup",
    combo: "mod+shift+c",
    run: () => void copySvg(),
  },
  copyLink: {
    description: "Copy share link",
    combo: "mod+shift+l",
    run: () => void copyShareLink(),
  },
  randomize: {
    description: "Randomize everything",
    combo: "r",
    run: randomizeSpec,
  },
  startFresh: {
    description: "Start fresh",
    combo: "n",
    run: startFresh,
  },
  focusSearch: {
    description: "Focus icon search",
    combo: "/",
    run: () => {
      const search = document.getElementById(SEARCH_INPUT_ID);
      if (search instanceof HTMLElement) {
        search.focus();
      }
    },
  },
  cycleMask: {
    description: "Cycle preview mask",
    combo: "m",
    run: () => {
      const store = useEditorStore.getState();
      const order = previewMaskSchema.options;
      const next = order[(order.indexOf(store.previewMask) + 1) % order.length];
      if (next) {
        store.setPreviewMask(next);
      }
    },
  },
});

export type ShortcutId = keyof typeof SHORTCUTS;

interface ParsedCombo {
  readonly key: string;
  readonly mod: boolean;
  readonly shift: boolean;
}

function parseCombo(combo: string): ParsedCombo {
  const parts = combo.toLowerCase().split("+");
  return {
    key: parts.at(-1) ?? "",
    mod: parts.includes("mod"),
    shift: parts.includes("shift"),
  };
}

/** Exact-modifier matching, so mod+Z and shift+mod+Z stay distinct. */
function comboMatches(combo: ParsedCombo, event: KeyboardEvent): boolean {
  return (
    event.key.toLowerCase() === combo.key &&
    (event.metaKey || event.ctrlKey) === combo.mod &&
    event.shiftKey === combo.shift
  );
}

const KEY_LABELS: Readonly<Record<string, string>> = {
  escape: "Esc",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
};

/** Display tokens for one shortcut, e.g. ["⇧", "⌘", "Z"]. */
export function shortcutKeys(id: ShortcutId): readonly string[] {
  const combo = parseCombo(SHORTCUTS[id].combo);
  return [
    ...(combo.shift ? [SHIFT_KEY] : []),
    ...(combo.mod ? [MOD_KEY] : []),
    KEY_LABELS[combo.key] ?? combo.key.toUpperCase(),
  ];
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

const MATCHERS = Object.values(SHORTCUTS).map((def) => ({
  def,
  combos: [def.combo, ...(def.aliases ?? [])].map(parseCombo),
}));

/** Installs the global handler; returns the teardown for useEffect. */
export function installShortcuts(): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    const editable = isEditableTarget(event.target);

    for (const { def, combos } of MATCHERS) {
      if (combos.some((combo) => comboMatches(combo, event))) {
        if (editable && def.worksInInputs !== true) {
          return;
        }
        event.preventDefault();
        def.run();
        return;
      }
    }

    if (editable || event.metaKey || event.ctrlKey) {
      return;
    }
    // Library switching is a key RANGE (1..n), hence not a registry entry.
    const library = iconLibraries[Number.parseInt(event.key, 10) - 1];
    if (library) {
      const store = useEditorStore.getState();
      store.setPickerLibrary(library.id);
      void store.loadLibrary(library.id);
    }
  };
  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}

export interface ShortcutEntry {
  readonly keys: readonly string[];
  readonly description: string;
}

const SHORTCUT_IDS = Object.keys(SHORTCUTS).filter((id): id is ShortcutId => id in SHORTCUTS);

/** Full list for the About dialog: registry entries plus display-only ones. */
export const KEYBOARD_SHORTCUTS: readonly ShortcutEntry[] = [
  ...SHORTCUT_IDS.map((id) => ({ keys: shortcutKeys(id), description: SHORTCUTS[id].description })),
  { keys: ["1", "3"], description: "Switch icon library (1 to 3)" },
  { keys: ["↑↓←→"], description: "Nudge icon by 1 px (canvas focused), Shift for 10 px" },
  { keys: ["Esc"], description: "Deselect icon" },
];

export const CANVAS_TIPS: readonly string[] = [
  "Click the icon to select it, then drag to move; it snaps to the center.",
  "Corner handles resize; the top handle rotates (Shift snaps to 15°).",
  "Double-click the canvas to re-center the icon.",
];
