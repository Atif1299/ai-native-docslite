import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const manifestPath = path.resolve(__dirname, "../ui-review.json");

describe("ui review coverage manifest", () => {
  it("covers the changed dashboard time helper with an executable public scenario", () => {
    if (!existsSync(manifestPath)) {
      throw new Error("root ui-review.json must exist");
    }

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      schema: number;
      scenarios: Array<{
        route: string;
        state: string;
        viewports: number[];
        theme?: string;
        ready_selector: string;
        covers: {
          changedPaths: string[];
          requirementKeys?: string[];
        };
      }>;
    };

    expect(manifest.schema, "manifest must use the v1 schema").toBe(1);
    expect(
      Array.isArray(manifest.scenarios),
      "manifest must declare scenarios",
    ).toBe(true);

    const scenario = manifest.scenarios.find((entry) =>
      entry.covers.changedPaths.includes("src/lib/time.ts"),
    );

    expect(
      scenario,
      "src/lib/time.ts must be covered by a review scenario",
    ).toBeDefined();
    expect(
      scenario?.route,
      "time helper scenario must use the public entry route",
    ).toBe("/");
    expect(
      scenario?.state,
      "time helper scenario must use a canonical state",
    ).toBe("resolved");
    expect(
      scenario?.viewports,
      "scenario must cover the supported review viewports",
    ).toEqual([375, 768, 1280]);
    expect(scenario?.theme, "scenario must declare an explicit theme").toBe(
      "light",
    );
    expect(
      scenario?.ready_selector,
      "scenario needs a visible ready selector",
    ).toBe("h1");
    for (const key of scenario?.covers.requirementKeys ?? []) {
      expect(
        key,
        `requirement alias ${key} must begin with AC followed by its index`,
      ).toMatch(/^AC\d+/);
    }
  });
});
