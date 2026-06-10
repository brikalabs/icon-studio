import { BrikaLogo } from "@brika/clay/components/brika-logo";
import { Button } from "@brika/clay/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@brika/clay/components/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@brika/clay/components/input-group";
import { Separator } from "@brika/clay/components/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@brika/clay/components/tooltip";
import {
  ChevronDown,
  Copy,
  Dices,
  Download,
  FileImage,
  FilePlus2,
  ImageDown,
  Link,
  Redo2,
  Search,
  Undo2,
} from "lucide-react";
import { AboutDialog } from "../features/about/AboutDialog";
import {
  copyPng,
  copyShareLink,
  copySvg,
  currentBaseName,
  exportPng,
  exportSvg,
  randomizeSpec,
  startFresh,
} from "../lib/spec-actions";
import { useCanRedo, useCanUndo, useEditorStore } from "../state/editor-store";
import { ShortcutKeys } from "./ShortcutKeys";

export function Header() {
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const baseName = useEditorStore((state) => (state.fileName ?? "").replace(/\.svg$/i, ""));
  const derivedBase = currentBaseName();
  const setFileName = useEditorStore((state) => state.setFileName);
  const setPaletteOpen = useEditorStore((state) => state.setPaletteOpen);

  return (
    <header className="grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b bg-card px-3">
      {/* Left cluster: logo + history + utilities, visually grouped */}
      <div className="flex items-center gap-1">
        <a
          href="https://brika.dev"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          aria-label="Brika home"
        >
          <BrikaLogo className="size-4" />
          <span className="hidden lg:inline">Icon Studio</span>
        </a>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <div className="flex items-center gap-0.5">
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
            <TooltipContent className="flex items-center gap-1.5">
              Undo
              <ShortcutKeys of="undo" />
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
            <TooltipContent className="flex items-center gap-1.5">
              Redo
              <ShortcutKeys of="redo" />
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={randomizeSpec}
                aria-label="Randomize everything"
              >
                <Dices />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Randomize everything</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={startFresh} aria-label="Start fresh">
                <FilePlus2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start fresh</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Center: file name. The .svg extension is fixed, shown as an addon. */}
      <InputGroup className="mx-auto w-44 sm:w-64">
        <InputGroupInput
          value={baseName}
          placeholder={derivedBase}
          onChange={(event) => {
            const next = event.target.value.replace(/\.svg$/i, "").trim();
            setFileName(next === "" ? null : `${next}.svg`);
          }}
          className="text-right font-mono text-xs"
          aria-label="Export file name"
        />
        <InputGroupAddon align="inline-end" className="font-mono text-muted-foreground text-xs">
          .svg
        </InputGroupAddon>
      </InputGroup>

      {/* Right cluster: about + search + export */}
      <div className="flex items-center justify-end gap-1.5">
        <AboutDialog />
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          aria-label="Open command palette"
          className="flex h-7 items-center gap-2 rounded-md border bg-background px-2 text-muted-foreground text-xs transition-colors hover:border-ring hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
        >
          <Search className="size-3" />
          <span className="hidden xl:inline">Search...</span>
          <ShortcutKeys of="palette" />
        </button>
        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={exportSvg} size="sm" className="rounded-r-none">
                <Download />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="flex items-center gap-1.5">
              Export SVG
              <ShortcutKeys of="exportSvg" />
            </TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="rounded-l-none border-l border-primary-foreground/20 px-2"
                aria-label="More export options"
              >
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => void exportPng()}>
                <FileImage />
                Export PNG
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void copySvg()}>
                <Copy />
                Copy SVG
                <DropdownMenuShortcut>
                  <ShortcutKeys of="copySvg" />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void copyPng()}>
                <ImageDown />
                Copy PNG
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void copyShareLink()}>
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
