import { useEditorStore } from "../../state/editor-store";
import { SliderRow } from "./SliderRow";

export function EffectsControls() {
  const glare = useEditorStore((state) => state.spec.glare);
  const noise = useEditorStore((state) => state.spec.noise);
  const noiseScale = useEditorStore((state) => state.spec.noiseScale);
  const updateSpec = useEditorStore((state) => state.updateSpec);

  return (
    <div className="flex flex-col gap-3">
      <SliderRow
        label="Glare"
        value={Math.round(glare * 100)}
        onChange={(next) => updateSpec({ glare: next / 100 })}
        min={0}
        max={100}
        step={1}
        unit="%"
      />
      <SliderRow
        label="Noise"
        value={Math.round(noise * 100)}
        onChange={(next) => updateSpec({ noise: next / 100 })}
        min={0}
        max={100}
        step={1}
        unit="%"
      />
      {noise > 0 ? (
        <SliderRow
          label="Grain size"
          value={Math.round(noiseScale * 100)}
          onChange={(next) => updateSpec({ noiseScale: next / 100 })}
          min={10}
          max={300}
          step={5}
          unit="%"
        />
      ) : null}
    </div>
  );
}
