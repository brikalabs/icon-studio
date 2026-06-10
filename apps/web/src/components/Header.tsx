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
import { Tooltip, TooltipContent, TooltipTrigger } from "@brika/clay/components/tooltip";
import { ChevronDown, Command, Copy, Download, Link, Redo2, Undo2 } from "lucide-react";
import { useExportActions } from "../lib/use-export-actions";
import { useCanRedo, useCanUndo, useEditorStore, useFileName } from "../state/editor-store";

export function Header() {
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const fileName = useFileName();
  const setFileName = useEditorStore((state) => state.setFileName);
  const setPaletteOpen = useEditorStore((state) => state.setPaletteOpen);
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

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPaletteOpen(true)}
          aria-label="Open command palette"
          className="text-muted-foreground"
        >
          <Command />
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Button>
        <div className="flex items-center">
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
      </div>
    </header>
  );
}
