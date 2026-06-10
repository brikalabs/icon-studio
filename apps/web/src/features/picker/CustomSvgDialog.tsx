import { Button } from "@brika/clay/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@brika/clay/components/dialog";
import { Textarea } from "@brika/clay/components/textarea";
import { toast } from "@brika/clay/components/toast";
import { buildIconSvg, type IconSource } from "@brika/icon-studio-core";
import { FileCode2 } from "lucide-react";
import { useState } from "react";
import { useEditorStore } from "../../state/editor-store";

/** Paste-any-SVG entry point: validates by test-composing before committing. */
export function CustomSvgDialog() {
  const [open, setOpen] = useState(false);
  const [markup, setMarkup] = useState("");
  const updateSpec = useEditorStore((state) => state.updateSpec);
  const markUndoBoundary = useEditorStore((state) => state.markUndoBoundary);

  const apply = () => {
    const icon: IconSource = { type: "custom", svg: markup.trim() };
    try {
      buildIconSvg({ icon });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid SVG");
      return;
    }
    markUndoBoundary();
    updateSpec({ icon });
    setOpen(false);
    toast.success("Custom SVG applied");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <FileCode2 />
          Use custom SVG
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Custom SVG</DialogTitle>
          <DialogDescription>
            Paste any SVG markup. It is scaled into the icon box; scripts and event handlers are
            stripped. Artwork using currentColor follows the icon color setting.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={markup}
          onChange={(event) => setMarkup(event.target.value)}
          placeholder={'<svg viewBox="0 0 24 24">...</svg>'}
          rows={8}
          className="font-mono text-xs"
          aria-label="SVG markup"
        />
        <DialogFooter>
          <Button onClick={apply} disabled={markup.trim() === ""}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
