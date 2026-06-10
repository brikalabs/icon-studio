import { beforeAll, describe, expect, test } from "bun:test";
import { ensureIconLibrary, searchIcons } from "@brika/icon-studio-core";
import { parseCliArgs } from "./args";

beforeAll(() => ensureIconLibrary("brand"));

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

  test("--lib selects the icon library", () => {
    const brand = parseCliArgs(["github", "--lib", "brand"], noFile);
    expect(brand.spec.icon).toEqual({ type: "brand", name: "github" });
    expect(brand.outFile).toBe("github.svg");
    expect(parseCliArgs(["tabler:bolt", "--lib", "iconify"], noFile).spec.icon).toEqual({
      type: "iconify",
      name: "tabler:bolt",
    });
  });

  test("applies a preset background", () => {
    const command = parseCliArgs(["bell", "--preset", "sunset"], noFile);
    expect(command.spec.background).toEqual({
      type: "linear",
      stops: [
        { color: "#FF512F", offset: 0 },
        { color: "#F09819", offset: 1 },
      ],
      angle: 45,
    });
  });

  test("builds a two-stop gradient from --from/--to with angle", () => {
    const command = parseCliArgs(
      ["rocket", "--from", "#3F5EFB", "--to", "#FC466B", "--angle", "120"],
      noFile,
    );
    expect(command.spec.background).toEqual({
      type: "linear",
      stops: [
        { color: "#3F5EFB", offset: 0 },
        { color: "#FC466B", offset: 1 },
      ],
      angle: 120,
    });
  });

  test("--stops builds multi-stop gradients with explicit offsets", () => {
    const command = parseCliArgs(["bell", "--stops", "000000_0-FF0000_25-FFFFFF_100"], noFile);
    expect(command.spec.background).toEqual({
      type: "linear",
      stops: [
        { color: "#000000", offset: 0 },
        { color: "#FF0000", offset: 0.25 },
        { color: "#FFFFFF", offset: 1 },
      ],
      angle: 45,
    });
  });

  test("--radial switches gradient type", () => {
    const command = parseCliArgs(["rocket", "--stops", "3F5EFB-FC466B", "--radial"], noFile);
    expect(command.spec.background.type).toBe("radial");
  });

  test("--bg builds a solid background", () => {
    const command = parseCliArgs(["bell", "--bg", "#18181B"], noFile);
    expect(command.spec.background).toEqual({ type: "solid", color: "#18181B" });
  });

  test("size, scale, offsets, rotation, stroke, noise, color, and out are honored", () => {
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
        "--rotate",
        "30",
        "--stroke",
        "1.5",
        "--noise",
        "0.2",
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
    expect(command.spec.rotation).toBe(30);
    expect(command.spec.strokeWidth).toBe(1.5);
    expect(command.spec.noise).toBe(0.2);
    expect(command.spec.iconColor).toBe("#FFD200");
    expect(command.outFile).toBe("result.svg");
  });

  test("--text builds a monogram icon with font options", () => {
    const command = parseCliArgs(
      ["--text", "BR", "--font", "mono", "--weight", "800", "--glare", "0.4", "--noise-scale", "2"],
      noFile,
    );
    expect(command.spec.icon).toEqual({
      type: "text",
      text: "BR",
      fontFamily: "mono",
      fontWeight: "800",
    });
    expect(command.spec.glare).toBe(0.4);
    expect(command.spec.noiseScale).toBe(2);
    expect(command.outFile).toBe("br.svg");
    expect(() => parseCliArgs(["--text", "BR", "--font", "comic"], noFile)).toThrow(
      "--font expects",
    );
    expect(() => parseCliArgs(["--text", "BR", "--weight", "950"], noFile)).toThrow(
      "--weight expects",
    );
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
    expect(parseCliArgs(["--search", "git", "--lib", "brand"], noFile).library).toBe("brand");
  });

  test("rejects bad input with clear errors", () => {
    expect(() => parseCliArgs([], noFile)).toThrow("missing icon name");
    expect(() => parseCliArgs(["bell", "--bg", "red"], noFile)).toThrow("hex color");
    expect(() => parseCliArgs(["bell", "--preset", "nope"], noFile)).toThrow("unknown preset");
    expect(() => parseCliArgs(["bell", "--lib", "nope"], noFile)).toThrow(
      "--lib expects one of lucide, brand, iconify",
    );
    expect(() => parseCliArgs(["bell", "--stops", "3F5EFB"], noFile)).toThrow("at least two");
    expect(() => parseCliArgs(["bell", "--from", "#FFFFFF"], noFile)).toThrow(
      "--from and --to must be used together",
    );
  });
});

describe("searchIcons via CLI contract", () => {
  test("lucide search ranks prefixes first", () => {
    expect(searchIcons("lucide", "bell", 25)[0]).toBe("bell");
  });

  test("brand searches find slugs", () => {
    expect(searchIcons("brand", "spotify", 25)).toContain("spotify");
  });
});
