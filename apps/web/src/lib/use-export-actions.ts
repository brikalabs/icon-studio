import { toast } from "@brika/clay/components/toast";
import { buildIconSvg } from "@brika/icon-studio-core";
import { useEditorStore, useFileName } from "../state/editor-store";
import { copyToClipboard, downloadSvg } from "./svg-io";

/** Export actions shared by the header buttons and the command palette. */
export function useExportActions() {
  const spec = useEditorStore((state) => state.spec);
  const fileName = useFileName();

  const renderSvg = (): string | null => {
    try {
      return buildIconSvg(spec);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not render the icon");
      return null;
    }
  };

  return {
    download: () => {
      const svg = renderSvg();
      if (svg) {
        downloadSvg(svg, fileName);
        toast.success(`Exported ${fileName}`);
      }
    },
    copySvg: async () => {
      const svg = renderSvg();
      if (svg) {
        await copyToClipboard(svg);
        toast.success("SVG copied to clipboard");
      }
    },
    copyLink: async () => {
      await copyToClipboard(window.location.href);
      toast.success("Share link copied");
    },
  };
}
