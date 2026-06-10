import { Kbd, KbdGroup } from "@brika/clay/components/kbd";
import { type ShortcutId, shortcutKeys } from "../lib/shortcuts";

interface ShortcutKeysProps {
  readonly of: ShortcutId;
}

/** Renders a registry shortcut as Kbd chips; rebinding updates every usage. */
export function ShortcutKeys({ of }: Readonly<ShortcutKeysProps>) {
  return (
    <KbdGroup>
      {shortcutKeys(of).map((key) => (
        <Kbd key={key}>{key}</Kbd>
      ))}
    </KbdGroup>
  );
}
