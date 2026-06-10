import { toast } from "@brika/clay/components/toast";
import {
  type Background,
  backgroundPresets,
  buildIconSvg,
  createDefaultIconSpec,
  getIconNames,
  type IconLibraryId,
  type IconSource,
  iconLibraries,
  isIconLibraryReady,
  suggestFileName,
} from "@brika/icon-studio-core";
import { useEditorStore } from "../state/editor-store";
import { copyToClipboard, downloadSvg } from "./svg-io";

function renderCurrentSvg(): string | null {
  try {
    return buildIconSvg(useEditorStore.getState().spec);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Could not render the icon");
    return null;
  }
}

export function exportSvg(): void {
  const svg = renderCurrentSvg();
  if (svg) {
    const { spec, fileName } = useEditorStore.getState();
    const name = fileName ?? suggestFileName(spec);
    downloadSvg(svg, name);
    toast.success(`Exported ${name}`);
  }
}

export async function copySvg(): Promise<void> {
  const svg = renderCurrentSvg();
  if (svg) {
    await copyToClipboard(svg);
    toast.success("SVG copied to clipboard");
  }
}

export async function copyShareLink(): Promise<void> {
  await copyToClipboard(window.location.href);
  toast.success("Share link copied");
}

/** Back to the default design; one undo step restores the previous state. */
export function startFresh(): void {
  const { markUndoBoundary, updateSpec, setFileName, setSelected } = useEditorStore.getState();
  markUndoBoundary();
  updateSpec(createDefaultIconSpec());
  setFileName(null);
  setSelected(false);
}

function randomItem<T>(items: readonly T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)];
}

/** Perceived lightness of the background's dominant color, 0..1. */
function backgroundLightness(background: Background): number {
  const hex =
    background.type === "solid" ? background.color : (background.stops[0]?.color ?? "#000000");
  const channel = (at: number) => Number.parseInt(hex.slice(at, at + 2), 16) / 255;
  return 0.299 * channel(1) + 0.587 * channel(3) + 0.114 * channel(5);
}

function randomIcon(): IconSource | undefined {
  // Iconify is excluded: its cache only holds what happens to be loaded.
  const loaded: IconLibraryId[] = iconLibraries
    .map((library) => library.id)
    .filter((id) => id !== "iconify" && isIconLibraryReady(id));
  const library = randomItem(loaded);
  const name = library === undefined ? undefined : randomItem(getIconNames(library));
  return library !== undefined && name !== undefined ? { type: library, name } : undefined;
}

/** Rolls a whole new design: icon, preset, contrast-aware color, size, grain. */
export function randomizeSpec(): void {
  const { markUndoBoundary, updateSpec } = useEditorStore.getState();
  const preset = randomItem(backgroundPresets);
  const icon = randomIcon();
  if (!preset || !icon) {
    return;
  }
  markUndoBoundary();
  updateSpec({
    icon,
    background: preset.background,
    iconColor: backgroundLightness(preset.background) > 0.6 ? "#18181B" : "#FFFFFF",
    iconScale: Number((0.45 + Math.random() * 0.25).toFixed(2)),
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    strokeWidth: 2,
    noise: Math.random() < 0.3 ? Number((0.15 + Math.random() * 0.15).toFixed(2)) : 0,
  });
}
