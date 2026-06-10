import { ColorPicker, ColorPickerSwatch } from "@brika/clay/components/color-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@brika/clay/components/popover";
import { hexColorSchema } from "@brika/icon-studio-core";

interface ColorFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
}

/** Labeled swatch row that opens Clay's color picker; commits hex values only. */
export function ColorField({ label, value, onChange }: Readonly<ColorFieldProps>) {
  const handleChange = (next: string) => {
    const parsed = hexColorSchema.safeParse(next);
    if (parsed.success) {
      onChange(parsed.data.toUpperCase());
    }
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Popover>
        <PopoverTrigger
          className="flex items-center gap-2 rounded-md border bg-card px-2 py-1 font-mono text-xs hover:border-ring"
          aria-label={`${label} color`}
        >
          <ColorPickerSwatch value={value} className="size-4 rounded-sm" />
          {value.toUpperCase()}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <ColorPicker
            value={value}
            onChange={handleChange}
            showAlpha={false}
            specialKeywords={[]}
            aria-label={`${label} color picker`}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
