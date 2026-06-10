import { Slider, SliderValue } from "@brika/clay/components/slider";

interface SliderRowProps {
  readonly label: string;
  readonly value: number;
  readonly onChange: (next: number) => void;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly unit?: string;
  readonly decimals?: number;
}

/** Labeled slider with a numeric readout, the standard control-panel row. */
export function SliderRow({ label, ...slider }: Readonly<SliderRowProps>) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
        <SliderValue width="w-14" {...slider} />
      </div>
      <Slider
        value={slider.value}
        onChange={slider.onChange}
        min={slider.min}
        max={slider.max}
        step={slider.step}
      />
    </div>
  );
}
