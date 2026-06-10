import { InputGroup, InputGroupAddon, InputGroupInput } from "@brika/clay/components/input-group";
import { Type } from "lucide-react";
import { useEditorStore } from "../../state/editor-store";

/** Type 1-4 characters to use a monogram instead of a glyph. */
export function TextIconInput() {
  const icon = useEditorStore((state) => state.spec.icon);
  const updateSpec = useEditorStore((state) => state.updateSpec);
  const markUndoBoundary = useEditorStore((state) => state.markUndoBoundary);

  const active = icon.type === "text";

  const apply = (raw: string) => {
    const text = raw.slice(0, 4);
    if (text === "") {
      if (active) {
        markUndoBoundary();
        updateSpec({ icon: { type: "lucide", name: "bell" } });
      }
      return;
    }
    if (icon.type === "text") {
      updateSpec({ icon: { ...icon, text } });
    } else {
      markUndoBoundary();
      updateSpec({ icon: { type: "text", text, fontFamily: "sans", fontWeight: "700" } });
    }
  };

  return (
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <Type className="size-4 text-muted-foreground" />
      </InputGroupAddon>
      <InputGroupInput
        value={active && icon.type === "text" ? icon.text : ""}
        onChange={(event) => apply(event.target.value)}
        maxLength={4}
        placeholder="Or type a monogram, e.g. BR"
        aria-label="Monogram text"
      />
    </InputGroup>
  );
}
