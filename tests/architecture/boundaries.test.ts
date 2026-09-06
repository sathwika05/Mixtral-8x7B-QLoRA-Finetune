import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function walk(dir: string): string[] {
  // Directories arrive over several tasks; a missing one is not a violation.
  if (!existsSync(dir)) return [];
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "api" || entry === "node_modules") continue;
      out = out.concat(walk(full));
    } else if (/\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const FORBIDDEN = [
  "lib/inference/client",
  "lib/inference/config",
  "MIXTRAL_API_URL",
  "MIXTRAL_API_KEY",
];

describe("presentation/inference boundary", () => {
  it("keeps server-only inference modules and secrets out of all presentation code", () => {
    const files = [...walk("components"), ...walk("app"), ...walk("hooks")];
    expect(files.length).toBeGreaterThan(0);

    const violations: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const needle of FORBIDDEN) {
        if (source.includes(needle)) violations.push(`${file} references ${needle}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
