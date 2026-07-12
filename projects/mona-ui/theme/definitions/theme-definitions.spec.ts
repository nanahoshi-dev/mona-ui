import { describe, expect, it } from "vitest";
import { themeDefinitions } from "./theme-definitions";

const canonicalColorGroups = [
    ["--color-canvas", "--color-surface", "--color-surface-muted", "--color-surface-raised", "--color-surface-overlay"],
    ["--color-input-background", "--color-border-control", "--color-border-control-hover"],
    ["--color-focus-indicator", "--color-disabled", "--color-disabled-background"],
    ...["success", "error", "warning", "info"].map(status => [
        `--color-${status}`,
        `--color-${status}-foreground`,
        `--color-${status}-subtle`,
        `--color-${status}-border`
    ]),
    ["--color-scrollbar-thumb", "--color-scrollbar-track", "--color-scrollbar-corner"],
    ["--color-chart-1", "--color-chart-2", "--color-chart-3", "--color-chart-4", "--color-chart-5"]
] as const;

describe("theme definitions", () => {
    it("keeps every theme variant on the same color contract", () => {
        const variants = Object.values(themeDefinitions).flatMap(definition => [definition.light, definition.dark]);
        const expectedKeys = Object.keys(variants[0]).filter(key => key.startsWith("--color-")).sort();

        for (const variant of variants) {
            expect(Object.keys(variant).filter(key => key.startsWith("--color-")).sort()).toEqual(expectedKeys);
        }
    });

    it("defines canonical semantic groups and compatibility aliases", () => {
        const compatibilityAliases = ["--color-background", "--color-input", "--color-input-border", "--color-popover"];

        for (const definition of Object.values(themeDefinitions)) {
            for (const variant of [definition.light, definition.dark]) {
                for (const group of canonicalColorGroups) {
                    expect(Object.keys(variant)).toEqual(expect.arrayContaining([...group]));
                }
                expect(Object.keys(variant)).toEqual(expect.arrayContaining(compatibilityAliases));
                expect(variant).toHaveProperty("--shadow-control");
                expect(variant).toHaveProperty("--shadow-raised");
                expect(variant).toHaveProperty("--shadow-overlay");
            }
        }
    });
});
