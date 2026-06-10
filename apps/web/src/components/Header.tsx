import { BrikaLogo } from "@brika/clay/components/brika-logo";
import { Button } from "@brika/clay/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@brika/clay/components/dropdown-menu";
import { Input } from "@brika/clay/components/input";
import { Kbd, KbdGroup } from "@brika/clay/components/kbd";
import { Separator } from "@brika/clay/components/separator";
import { toast } from "@brika/clay/components/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@brika/clay/components/tooltip";
import { buildIconSvg } from "@brika/icon-studio-core";
import { ChevronDown, Copy, Download, Link, Redo2, Undo2 } from "lucide-react";
import { copyToClipboard, downloadSvg } from "../lib/svg-io";
import { useCanRedo, useCanUndo, useEditorStore, useFileName } from "../state/editor-store";

function useExportActions() {
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

export function Header() {
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const fileName = useFileName();
  const setFileName = useEditorStore((state) => state.setFileName);
  const exportActions = useExportActions();

  return (
    <header className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b px-4">
      <div className="flex items-center gap-3">
        <a
          href="https://brika.dev"
          className="flex items-center gap-2 font-semibold"
          aria-label="Brika home"
        >
          <BrikaLogo className="size-5" />
          Icon Studio
        </a>
        <Separator orientation="vertical" className="h-5" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={undo}
              disabled={!canUndo}
              aria-label="Undo"
            >
              <Undo2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Undo{" "}
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>Z</Kbd>
            </KbdGroup>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={redo}
              disabled={!canRedo}
              aria-label="Redo"
            >
              <Redo2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Redo{" "}
            <KbdGroup>
              <Kbd>⇧</Kbd>
              <Kbd>⌘</Kbd>
              <Kbd>Z</Kbd>
            </KbdGroup>
          </TooltipContent>
        </Tooltip>
      </div>

      <Input
        value={fileName}
        onChange={(event) => setFileName(event.target.value)}
        onBlur={(event) => {
          if (event.target.value.trim() === "") {
            setFileName(null);
          }
        }}
        className="w-56 text-center font-mono text-xs"
        aria-label="Export file name"
      />

      <div className="flex items-center justify-end">
        <Button onClick={exportActions.download} className="rounded-r-none">
          <Download />
          Export SVG
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              className="rounded-l-none border-l border-primary-foreground/20"
              aria-label="More export options"
            >
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => void exportActions.copySvg()}>
              <Copy />
              Copy SVG
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void exportActions.copyLink()}>
              <Link />
              Copy share link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
