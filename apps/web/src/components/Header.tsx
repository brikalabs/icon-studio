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
import {
  ChevronDown,
  Copy,
  Dices,
  Download,
  FilePlus2,
  Link,
  Redo2,
  Search,
  Undo2,
} from "lucide-react";
import { AboutDialog } from "../features/about/AboutDialog";
import { copyShareLink, copySvg, exportSvg, randomizeSpec, startFresh } from "../lib/spec-actions";
import { useCanRedo, useCanUndo, useEditorStore, useFileName } from "../state/editor-store";

export function Header() {
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const fileName = useFileName();
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

      {/* Center: file name */}
      <Input
        value={fileName}
        onChange={(event) => setFileName(event.target.value)}
        onBlur={(event) => {
          if (event.target.value.trim() === "") {
            setFileName(null);
          }
        }}
        className="w-36 text-center font-mono text-xs sm:w-52"
        aria-label="Export file name"
      />

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
          <Kbd>⌘K</Kbd>
        </button>
        <div className="flex items-center">
          <Button onClick={exportSvg} size="sm" className="rounded-r-none">
            <Download />
            <span className="hidden sm:inline">Export</span>
          </Button>
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
              <DropdownMenuItem onSelect={() => void copySvg()}>
                <Copy />
                Copy SVG
              </DropdownMenuItem>
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
