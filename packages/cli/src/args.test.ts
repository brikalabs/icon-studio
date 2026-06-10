import { describe, expect, test } from "bun:test";
import { searchLucideIcons } from "@brika/icon-studio-core";
import { parseCliArgs } from "./args";

const noFile = (): string => {
  throw new Error("no file access expected");
};

describe("parseCliArgs", () => {
  test("generates from an icon name with defaults", () => {
    const command = parseCliArgs(["bell"], noFile);
    expect(command.kind).toBe("generate");
    expect(command.spec.icon).toEqual({ type: "lucide", name: "bell" });
    expect(command.outFile).toBe("bell.svg");
  });

  test("applies a preset background", () => {
    const command = parseCliArgs(["bell", "--preset", "sunset"], noFile);
    expect(command.spec.background).toEqual({
      type: "linear",
      from: "#FF512F",
      to: "#F09819",
      angle: 45,
    });
  });

  test("builds a custom gradient with angle", () => {
    const command = parseCliArgs(
      ["rocket", "--from", "#3F5EFB", "--to", "#FC466B", "--angle", "120"],
      noFile,
    );
    expect(command.spec.background).toEqual({
      type: "linear",
      from: "#3F5EFB",
      to: "#FC466B",
      angle: 120,
    });
  });

  test("--radial switches gradient type", () => {
    const command = parseCliArgs(
      ["rocket", "--from", "#3F5EFB", "--to", "#FC466B", "--radial"],
      noFile,
    );
    expect(command.spec.background.type).toBe("radial");
  });

  test("--bg builds a solid background", () => {
    const command = parseCliArgs(["bell", "--bg", "#18181B"], noFile);
    expect(command.spec.background).toEqual({ type: "solid", color: "#18181B" });
  });

  test("size, scale, offsets, stroke, color, and out are honored", () => {
    const command = parseCliArgs(
      [
        "bell",
        "-s",
        "1024",
        "--scale",
        "0.4",
        "--x",
        "10",
        "--y=-5",
        "--stroke",
        "1.5",
        "--icon-color",
        "#FFD200",
        "-o",
        "result.svg",
      ],
      noFile,
    );
    expect(command.spec.canvasSize).toBe(1024);
    expect(command.spec.iconScale).toBe(0.4);
    expect(command.spec.offsetX).toBe(10);
    expect(command.spec.offsetY).toBe(-5);
    expect(command.spec.strokeWidth).toBe(1.5);
    expect(command.spec.iconColor).toBe("#FFD200");
    expect(command.outFile).toBe("result.svg");
  });

  test("--custom reads the SVG file", () => {
    const command = parseCliArgs(["--custom", "logo.svg"], (path) => {
      expect(path).toBe("logo.svg");
      return "<svg viewBox='0 0 1 1'></svg>";
    });
    expect(command.spec.icon.type).toBe("custom");
    expect(command.outFile).toBe("icon.svg");
  });

  test("help, list-presets, and search modes", () => {
    expect(parseCliArgs(["--help"], noFile).kind).toBe("help");
    expect(parseCliArgs(["--list-presets"], noFile).kind).toBe("list-presets");
    const search = parseCliArgs(["--search", "alarm"], noFile);
    expect(search.kind).toBe("search");
    expect(search.query).toBe("alarm");
  });

  test("rejects missing icon name, bad colors, unknown presets, lone --from", () => {
    expect(() => parseCliArgs([], noFile)).toThrow("missing icon name");
    expect(() => parseCliArgs(["bell", "--bg", "red"], noFile)).toThrow("hex color");
    expect(() => parseCliArgs(["bell", "--preset", "nope"], noFile)).toThrow("unknown preset");
    expect(() => parseCliArgs(["bell", "--from", "#FFFFFF"], noFile)).toThrow(
      "--from and --to must be used together",
    );
  });
});

describe("searchLucideIcons", () => {
  test("matches names and ranks prefixes first", () => {
    const results = searchLucideIcons("bell", 25);
    expect(results[0]).toBe("bell");
    expect(results).toContain("bell-off");
  });

  test("matches tags", () => {
    expect(searchLucideIcons("alarm", 25).length).toBeGreaterThan(0);
  });

  test("empty query returns the full catalogue", () => {
    expect(searchLucideIcons("  ").length).toBeGreaterThan(1500);
  });
});
