import { wcagContrast } from "culori";
import type { ThemeColors } from "../models/ThemeDefinition";
import { builtInThemes } from "./built-in-themes";
import { monaTheme } from "./mona-theme";
import { renaTheme } from "./rena-theme";
import { createDefaultThemeEffects, createDefaultThemeShape } from "./theme-primitives";

const profiles = [renaTheme.variants.light, renaTheme.variants.dark] as const;

describe("Rena theme", () => {
    it("registers complete independent light and dark profiles", () => {
        expect(builtInThemes.rena).toBe(renaTheme);
        expect(renaTheme.variants.light).not.toBe(renaTheme.variants.dark);

        for (const profile of profiles) {
            for (const section of ["colors", "components", "effects", "shadows", "shape"] as const) {
                expect(Object.keys(profile[section]).sort()).toEqual(
                    Object.keys(monaTheme.variants.light[section]).sort()
                );
            }
        }
    });

    it("stays opaque on the shared radius scale", () => {
        for (const profile of profiles) {
            expect(profile.effects).toEqual(createDefaultThemeEffects());
            expect(profile.shape).toEqual(createDefaultThemeShape());
        }
    });

    it("draws a solid focus ring in both variants", () => {
        for (const profile of profiles) {
            expect(profile.custom).toMatchObject({
                "--mona-focus-ring-opacity": "100%",
                "--mona-focus-ring-width": "1px"
            });
        }
    });

    it("puts white panels on a gray page in light and an indigo primary in both variants", () => {
        expect(renaTheme.variants.light.colors).toMatchObject({
            "--color-canvas": "#f9fafb",
            "--color-surface": "#ffffff",
            "--color-surface-muted": "#f9fafb",
            "--color-border-control": "#d1d5db",
            "--color-primary": "#4f46e5",
            "--color-selected": "#eef2ff"
        });
        expect(renaTheme.variants.dark.colors).toMatchObject({
            "--color-canvas": "#111827",
            "--color-surface-overlay": "#1f2937",
            "--color-primary": "#4f46e5",
            "--color-focus-indicator": "#818cf8"
        });
    });

    it("keeps selection a tint, so text on it stays readable", () => {
        for (const profile of profiles) {
            const colors = profile.colors;
            expect(resolve(colors, "--color-selected")).not.toBe(resolve(colors, "--color-primary"));
            expect(
                wcagContrast(resolve(colors, "--color-selected-foreground"), resolve(colors, "--color-selected"))
            ).toBeGreaterThanOrEqual(4.5);
        }
    });

    it("draws what's only a fill in a lighter indigo in dark, with readable text on it", () => {
        const { colors, custom } = renaTheme.variants.dark;
        expect(custom["--mona-indicator-color"]).toBe("var(--color-focus-indicator)");
        expect(custom["--mona-primary-text-color"]).toBe("var(--color-focus-indicator)");
        expect(
            wcagContrast(custom["--mona-indicator-foreground"], resolve(colors, "--color-focus-indicator"))
        ).toBeGreaterThanOrEqual(4.5);
    });

    it("keeps white text on every primary state", () => {
        for (const profile of profiles) {
            for (const state of ["primary", "primary-hover", "primary-active", "primary-selected"] as const) {
                expect(
                    wcagContrast(
                        resolve(profile.colors, "--color-primary-foreground"),
                        resolve(profile.colors, `--color-${state}`)
                    )
                ).toBeGreaterThanOrEqual(4.5);
            }
        }
    });

    it("casts plain drop shadows", () => {
        for (const profile of profiles) {
            for (const shadow of Object.values(profile.shadows)) {
                expect(shadow).toMatch(/^0 \d+px \d+px/);
                expect(shadow).not.toContain("inset");
            }
        }
    });
});

function resolve(colors: ThemeColors, name: `--color-${string}`): string {
    const value = colors[name];
    const alias = /^var\((--color-[^)]+)\)$/.exec(value)?.[1] as `--color-${string}` | undefined;
    return alias ? resolve(colors, alias) : value;
}
