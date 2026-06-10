import {
  createDefaultIconSpec,
  ensureIconifyIcons,
  ensureIconLibrary,
  type IconLibraryId,
  type IconSpec,
  isIconLibraryReady,
  specFromSearchParams,
  specToSearchParams,
  suggestFileName,
} from "@brika/icon-studio-core";
import { z } from "zod";
import { create } from "zustand";

/** Preview-only crop simulating platform icon masks; exports always stay square. */
export const previewMaskSchema = z.enum(["square", "rounded", "squircle", "circle"]);
export type PreviewMask = z.infer<typeof previewMaskSchema>;

const HISTORY_LIMIT = 100;
/** Edits closer together than this collapse into one undo step (slider drags). */
const COALESCE_WINDOW_MS = 400;

interface EditorState {
  spec: IconSpec;
  /** User-chosen file name; null derives it from the current icon. */
  fileName: string | null;
  /** Whether the icon layer is selected, which shows the transform handles. */
  selected: boolean;
  /** Bumps when a lazy icon catalogue finishes loading, so views recompute. */
  catalogueVersion: number;
  past: IconSpec[];
  future: IconSpec[];
  lastEditAt: number;
  updateSpec: (partial: Partial<IconSpec>) => void;
  /** Forces the next updateSpec to start a fresh undo step (drag start). */
  markUndoBoundary: () => void;
  setFileName: (name: string | null) => void;
  setSelected: (selected: boolean) => void;
  /** Loads a lazy icon catalogue chunk; safe to call repeatedly. */
  loadLibrary: (id: IconLibraryId) => Promise<void>;
  /** Fetches specific Iconify icons into the cache; safe to call repeatedly. */
  loadIconifyIcons: (names: readonly string[]) => Promise<void>;
  /** Whether the command palette is open. */
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  /** Which library tab the picker shows; lifted so the palette can navigate it. */
  pickerLibrary: IconLibraryId;
  setPickerLibrary: (library: IconLibraryId) => void;
  /** Mask applied to the preview only, to verify circle/squircle/radius crops. */
  previewMask: PreviewMask;
  setPreviewMask: (mask: PreviewMask) => void;
  undo: () => void;
  redo: () => void;
}

function initialSpec(): IconSpec {
  if (typeof window === "undefined") {
    return createDefaultIconSpec();
  }
  return specFromSearchParams(new URLSearchParams(window.location.search));
}

const initial = initialSpec();

export const useEditorStore = create<EditorState>((set) => ({
  spec: initial,
  fileName: null,
  selected: false,
  catalogueVersion: 0,
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
  loadLibrary: async (id) => {
    if (isIconLibraryReady(id)) {
      return;
    }
    await ensureIconLibrary(id);
    set((state) => ({ catalogueVersion: state.catalogueVersion + 1 }));
  },
  loadIconifyIcons: async (names) => {
    await ensureIconifyIcons(names);
    set((state) => ({ catalogueVersion: state.catalogueVersion + 1 }));
  },
  paletteOpen: false,
  setPaletteOpen: (open) => set({ paletteOpen: open }),
  // A shared link opens the picker on the library it points at.
  pickerLibrary: initial.icon.type === "custom" ? "lucide" : initial.icon.type,
  setPickerLibrary: (library) => set({ pickerLibrary: library }),
  previewMask: "square",
  setPreviewMask: (mask) => set({ previewMask: mask }),
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
