import { converter, parse, wcagContrast } from "culori";
import type { ThemeColors } from "../models/ThemeDefinition";
import { annaThemeColors } from "./anna-theme-colors";
import { monaThemeColors } from "./mona-theme-colors";

describe("annaThemeColors", () => {
    it("ships only the dark variant with the complete Mona runtime color contract", () => {
        expect(annaThemeColors).not.toHaveProperty("light");
        expect(Object.keys(annaThemeColors.dark).sort()).toEqual(Object.keys(monaThemeColors.dark).sort());
    });

    it("owns the dark graphite canvas and violet identity independently", () => {
        expect(annaThemeColors.dark).toEqual(
            expect.objectContaining({
                "--color-canvas": "#202123",
                "--color-surface": "#1D1E20",
                "--color-surface-muted": "#161718",
                "--color-surface-overlay": "#161718",
                "--color-border-control": "#0F0F10",
                "--color-border-control-hover": "#17181A",
                "--color-primary": "#583573",
                "--color-selected": "var(--color-accent)",
                "--color-focus-indicator": "#A174C2"
            })
        );
        expect(annaThemeColors.dark).not.toBe(monaThemeColors.dark);
    });

    it("defines charts, scrollbars, compatibility aliases, and no tester-owned colors", () => {
        expect(annaThemeColors.dark).toEqual(
            expect.objectContaining({
                "--color-background": "var(--color-surface)",
                "--color-popover": "var(--color-surface-overlay)",
                "--color-chart-5": "#FFDA6B",
                "--color-scrollbar-track": "#161718"
            })
        );
        expect(annaThemeColors.dark).not.toHaveProperty("--color-page-background");
        expect(annaThemeColors.dark).not.toHaveProperty("--color-demo-background");
    });

    it("meets text and focus contrast targets", () => {
        const colors = annaThemeColors.dark;

        expectContrast(colors, "--color-foreground", "--color-surface", 4.5);
        expectContrast(colors, "--color-muted-foreground", "--color-canvas", 4.5);
        expectContrast(colors, "--color-input-foreground", "--color-input-background", 4.5);
        expectContrast(colors, "--color-focus-indicator", "--color-input-background", 3);
        expectContrast(colors, "--color-disabled-foreground", "--color-disabled-background", 4.5);
        expectContrast(colors, "--color-primary-foreground", "--color-primary", 4.5);
    });

    it("keeps resting, hovered, and disabled borders darker than their surfaces", () => {
        const colors = annaThemeColors.dark;

        expectDarker(colors, "--color-border-control", "--color-input-background");
        expectDarker(colors, "--color-border-control-hover", "--color-input-background");
        expectDarker(colors, "--color-disabled-border", "--color-disabled-background");
        expectDarker(colors, "--color-border-control", "--color-border-control-hover");
    });

    it("retains the dark theme's sunken overlay hierarchy", () => {
        expectDarker(annaThemeColors.dark, "--color-surface-overlay", "--color-input-background");
        expectDarker(annaThemeColors.dark, "--color-surface-overlay", "--color-surface-raised");
    });
});

function expectContrast(
    colors: ThemeColors,
    foreground: `--color-${string}`,
    background: `--color-${string}`,
    minimum: number
): void {
    expect(wcagContrast(resolveColor(colors, foreground), resolveColor(colors, background))).toBeGreaterThanOrEqual(
        minimum
    );
}

function resolveColor(colors: ThemeColors, name: `--color-${string}`): string {
    const value = colors[name];
    const alias = /^var\((--color-[^)]+)\)$/.exec(value);
    return alias?.[1] ? resolveColor(colors, alias[1] as `--color-${string}`) : value;
}

function expectDarker(colors: ThemeColors, darker: `--color-${string}`, lighter: `--color-${string}`): void {
    const toOklch = converter("oklch");
    const darkerColor = toOklch(parse(resolveColor(colors, darker)));
    const lighterColor = toOklch(parse(resolveColor(colors, lighter)));

    if (!darkerColor || !lighterColor) {
        throw new Error(`Expected parsable colors for ${darker} and ${lighter}.`);
    }

    expect(darkerColor.l).toBeLessThan(lighterColor.l);
}
