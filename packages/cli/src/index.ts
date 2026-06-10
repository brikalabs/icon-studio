#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "node:fs";
import { backgroundPresets, buildIconSvg, searchLucideIcons } from "@brika/icon-studio-core";
import { HELP_TEXT, parseCliArgs } from "./args";

function main(argv: readonly string[]): number {
  const command = parseCliArgs(argv, (path) => readFileSync(path, "utf8"));

  switch (command.kind) {
    case "help":
      console.log(HELP_TEXT);
      return 0;
    case "list-presets": {
      for (const preset of backgroundPresets) {
        const bg = preset.background;
        const summary =
          bg.type === "solid" ? `solid ${bg.color}` : `${bg.type} ${bg.from} -> ${bg.to}`;
        console.log(`${preset.id.padEnd(12)} ${summary}`);
      }
      return 0;
    }
    case "search": {
      const results = searchLucideIcons(command.query, 25);
      if (results.length === 0) {
        console.error(`no lucide icons match "${command.query}"`);
        return 1;
      }
      for (const name of results) {
        console.log(name);
      }
      return 0;
    }
    case "generate": {
      writeFileSync(command.outFile, `${buildIconSvg(command.spec)}\n`);
      console.log(`wrote ${command.outFile}`);
      return 0;
    }
  }
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(`brika-icon: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
