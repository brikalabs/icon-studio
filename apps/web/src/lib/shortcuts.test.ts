import { describe, expect, test } from "bun:test";
import { resolveShortcutId, shortcutKeys } from "./shortcuts";

interface FakeEventInit {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
}

function event({ key, meta = false, ctrl = false, shift = false }: FakeEventInit): KeyboardEvent {
  return { key, metaKey: meta, ctrlKey: ctrl, shiftKey: shift } as KeyboardEvent;
}

describe("resolveShortcutId", () => {
  test("Cmd+K and Ctrl+K both open the palette", () => {
    expect(resolveShortcutId(event({ key: "k", meta: true }))).toBe("palette");
    expect(resolveShortcutId(event({ key: "k", ctrl: true }))).toBe("palette");
    // Caps lock yields an uppercase key; matching is case-insensitive.
    expect(resolveShortcutId(event({ key: "K", meta: true }))).toBe("palette");
  });

  test("modifier sets stay distinct (undo vs redo)", () => {
    expect(resolveShortcutId(event({ key: "z", meta: true }))).toBe("undo");
    expect(resolveShortcutId(event({ key: "z", meta: true, shift: true }))).toBe("redo");
  });

  test("export and copy", () => {
    expect(resolveShortcutId(event({ key: "s", meta: true }))).toBe("exportSvg");
    expect(resolveShortcutId(event({ key: "c", meta: true, shift: true }))).toBe("copySvg");
  });

  test("bare keys require no modifier", () => {
    expect(resolveShortcutId(event({ key: "/" }))).toBe("focusSearch");
    expect(resolveShortcutId(event({ key: "m" }))).toBe("cycleMask");
    // Cmd+M is the OS minimize, must not trigger the mask cycle.
    expect(resolveShortcutId(event({ key: "m", meta: true }))).toBeNull();
  });

  test("plain k without a modifier is not a shortcut", () => {
    expect(resolveShortcutId(event({ key: "k" }))).toBeNull();
  });

  test("shortcutKeys renders platform-correct tokens", () => {
    const keys = shortcutKeys("palette");
    expect(keys.at(-1)).toBe("K");
    expect(keys[0] === "⌘" || keys[0] === "Ctrl").toBe(true);
  });
});
