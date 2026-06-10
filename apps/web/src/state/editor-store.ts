import {
  createDefaultIconSpec,
  ensureBrandIcons,
  type IconSpec,
  specFromSearchParams,
  specToSearchParams,
  suggestFileName,
} from "@brika/icon-studio-core";
import { create } from "zustand";

const HISTORY_LIMIT = 100;
/** Edits closer together than this collapse into one undo step (slider drags). */
const COALESCE_WINDOW_MS = 400;

interface EditorState {
  spec: IconSpec;
  /** User-chosen file name; null derives it from the current icon. */
  fileName: string | null;
  /** Whether the icon layer is selected, which shows the transform handles. */
  selected: boolean;
  /** True once the lazy simple-icons catalogue has loaded. */
  brandsReady: boolean;
  past: IconSpec[];
  future: IconSpec[];
  lastEditAt: number;
  updateSpec: (partial: Partial<IconSpec>) => void;
  /** Forces the next updateSpec to start a fresh undo step (drag start). */
  markUndoBoundary: () => void;
  setFileName: (name: string | null) => void;
  setSelected: (selected: boolean) => void;
  /** Loads the brand catalogue chunk; safe to call repeatedly. */
  loadBrands: () => Promise<void>;
  undo: () => void;
  redo: () => void;
}

function initialSpec(): IconSpec {
  if (typeof window === "undefined") {
    return createDefaultIconSpec();
  }
  return specFromSearchParams(new URLSearchParams(window.location.search));
}

export const useEditorStore = create<EditorState>((set) => ({
  spec: initialSpec(),
  fileName: null,
  selected: false,
  brandsReady: false,
  past: [],
  future: [],
  lastEditAt: 0,
  updateSpec: (partial) =>
    set((state) => {
      const now = Date.now();
      const coalesce = now - state.lastEditAt < COALESCE_WINDOW_MS;
      const past = coalesce ? state.past : [...state.past, state.spec].slice(-HISTORY_LIMIT);
      return {
        spec: { ...state.spec, ...partial },
        past,
        future: [],
        lastEditAt: now,
      };
    }),
  markUndoBoundary: () => set({ lastEditAt: 0 }),
  setFileName: (name) => set({ fileName: name }),
  setSelected: (selected) => set({ selected }),
  loadBrands: async () => {
    await ensureBrandIcons();
    set({ brandsReady: true });
  },
  undo: () =>
    set((state) => {
      const previous = state.past.at(-1);
      if (!previous) {
        return state;
      }
      return {
        spec: previous,
        past: state.past.slice(0, -1),
        future: [state.spec, ...state.future],
        lastEditAt: 0,
      };
    }),
  redo: () =>
    set((state) => {
      const next = state.future.at(0);
      if (!next) {
        return state;
      }
      return {
        spec: next,
        past: [...state.past, state.spec].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        lastEditAt: 0,
      };
    }),
}));

export function useCanUndo(): boolean {
  return useEditorStore((state) => state.past.length > 0);
}

export function useCanRedo(): boolean {
  return useEditorStore((state) => state.future.length > 0);
}

export function useFileName(): string {
  return useEditorStore((state) => state.fileName ?? suggestFileName(state.spec));
}

/** Mirrors the current spec into the address bar so every state is a share link. */
export function syncSpecToUrl(spec: IconSpec): void {
  const query = specToSearchParams(spec).toString();
  const url = query === "" ? window.location.pathname : `${window.location.pathname}?${query}`;
  window.history.replaceState(null, "", url);
}
