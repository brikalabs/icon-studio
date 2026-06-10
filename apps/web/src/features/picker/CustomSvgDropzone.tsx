import {
  Dropzone,
  DropzoneDescription,
  DropzoneIcon,
  DropzoneTitle,
} from "@brika/clay/components/dropzone";
import { toast } from "@brika/clay/components/toast";
import { buildIconSvg, type IconSource } from "@brika/icon-studio-core";
import { FileCode2 } from "lucide-react";
import { useEditorStore } from "../../state/editor-store";

const MAX_SVG_BYTES = 1024 * 1024;

/** Drop or pick an .svg file to use as the icon artwork. */
export function CustomSvgDropzone() {
  const updateSpec = useEditorStore((state) => state.updateSpec);
  const markUndoBoundary = useEditorStore((state) => state.markUndoBoundary);

  const apply = async (file: File) => {
    const icon: IconSource = { type: "custom", svg: (await file.text()).trim() };
    try {
      buildIconSvg({ icon });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid SVG file");
      return;
    }
    markUndoBoundary();
    updateSpec({ icon });
    toast.success(`Using ${file.name}`);
  };

  return (
    <Dropzone
      accept=".svg,image/svg+xml"
      maxSize={MAX_SVG_BYTES}
      onDrop={(files) => {
        const file = files[0];
        if (file) {
          void apply(file);
        }
      }}
      onReject={() => toast.error("SVG file is too large (1 MB max)")}
      className="w-full"
      aria-label="Import a custom SVG file"
    >
      <DropzoneIcon>
        <FileCode2 />
      </DropzoneIcon>
      <DropzoneTitle>Custom SVG</DropzoneTitle>
      <DropzoneDescription>Drop a file here or click to browse</DropzoneDescription>
    </Dropzone>
  );
}
