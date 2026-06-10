import { ColorPicker, ColorPickerSwatch } from "@brika/clay/components/color-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@brika/clay/components/popover";
import { hexColorSchema } from "@brika/icon-studio-core";

interface ColorSwatchButtonProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
  /** Hide the hex text and show only the swatch (compact contexts). */
  readonly swatchOnly?: boolean;
}

/** Swatch trigger that opens Clay's color picker; commits hex values only. */
export function ColorSwatchButton({
  label,
  value,
  onChange,
  swatchOnly = false,
}: Readonly<ColorSwatchButtonProps>) {
  const handleChange = (next: string) => {
    const parsed = hexColorSchema.safeParse(next);
    if (parsed.success) {
      onChange(parsed.data.toUpperCase());
    }
  };

  return (
    <Popover>
      <PopoverTrigger
        className="flex items-center gap-2 rounded-md border bg-card px-2 py-1 font-mono text-xs transition-colors hover:border-ring focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
        aria-label={`${label} color`}
      >
        <ColorPickerSwatch value={value} className="size-3.5 rounded-sm" />
        {swatchOnly ? null : value.toUpperCase()}
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
  );
}

interface ColorFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
}

/** Labeled row variant of {@link ColorSwatchButton}. */
export function ColorField({ label, value, onChange }: Readonly<ColorFieldProps>) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </span>
      <ColorSwatchButton label={label} value={value} onChange={onChange} />
    </div>
  );
}
