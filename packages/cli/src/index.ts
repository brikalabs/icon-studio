#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "node:fs";
import {
  type Background,
  backgroundPresets,
  buildIconSvg,
  ensureBrandIcons,
  searchIcons,
} from "@brika/icon-studio-core";
import { HELP_TEXT, parseCliArgs } from "./args";

function describeBackground(background: Background): string {
  if (background.type === "solid") {
    return `solid ${background.color}`;
  }
  return `${background.type} ${background.stops.map((stop) => stop.color).join(" -> ")}`;
}

async function main(argv: readonly string[]): Promise<number> {
  const command = parseCliArgs(argv, (path) => readFileSync(path, "utf8"));
  if (command.library === "brand" || command.spec.icon.type === "brand") {
    await ensureBrandIcons();
  }

  switch (command.kind) {
    case "help":
      console.log(HELP_TEXT);
      return 0;
    case "list-presets":
      for (const preset of backgroundPresets) {
        console.log(`${preset.id.padEnd(12)} ${describeBackground(preset.background)}`);
      }
      return 0;
    case "search": {
      const results = searchIcons(command.library, command.query, 25);
      if (results.length === 0) {
        console.error(`no ${command.library} icons match "${command.query}"`);
        return 1;
      }
      for (const name of results) {
        console.log(name);
      }
      return 0;
    }
    case "generate":
      writeFileSync(command.outFile, `${buildIconSvg(command.spec)}\n`);
      console.log(`wrote ${command.outFile}`);
      return 0;
  }
}

try {
  process.exitCode = await main(process.argv.slice(2));
} catch (error) {
  console.error(`brika-icon: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
