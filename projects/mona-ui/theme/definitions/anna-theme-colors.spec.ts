import { converter, parse, wcagContrast } from "culori";
import type { ThemeColors } from "../models/ThemeDefinition";
import { annaThemeColors } from "./anna-theme-colors";
import { monaThemeColors } from "./mona-theme-colors";

describe("annaThemeColors", () => {
    const variants = [annaThemeColors.light, annaThemeColors.dark] as const;

    it("ships light and dark variants that match the complete Mona runtime color contract", () => {
        expect(Object.keys(annaThemeColors.light).sort()).toEqual(Object.keys(monaThemeColors.light).sort());
        expect(Object.keys(annaThemeColors.dark).sort()).toEqual(Object.keys(monaThemeColors.dark).sort());
        expect(Object.keys(annaThemeColors.light).sort()).toEqual(Object.keys(annaThemeColors.dark).sort());
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

    it("owns the light graphite inverse and solid violet selection independently", () => {
        expect(annaThemeColors.light).toEqual(
            expect.objectContaining({
                "--color-canvas": "#E7E7EA",
                "--color-surface": "#F0F0F2",
                "--color-surface-muted": "#D9D9DE",
                "--color-surface-overlay": "#D9D9DE",
                "--color-input-background": "#F3F3F5",
                "--color-border-control": "#898993",
                "--color-primary": "#583573",
                "--color-accent": "#583573",
                "--color-selected": "var(--color-accent)",
                "--color-focus-indicator": "#8159A0"
            })
        );
        expect(annaThemeColors.light).not.toBe(monaThemeColors.light);
    });

    it("defines charts, scrollbars, compatibility aliases, and no tester-owned colors", () => {
        expect(annaThemeColors.light).toEqual(
            expect.objectContaining({
                "--color-background": "var(--color-surface)",
                "--color-popover": "var(--color-surface-overlay)",
                "--color-chart-5": "#B34B62",
                "--color-scrollbar-track": "#D9D9DE"
            })
        );
        expect(annaThemeColors.dark).toEqual(
            expect.objectContaining({
                "--color-background": "var(--color-surface)",
                "--color-popover": "var(--color-surface-overlay)",
                "--color-chart-5": "#FFDA6B",
                "--color-scrollbar-track": "#161718"
            })
        );
        for (const colors of variants) {
            expect(colors).not.toHaveProperty("--color-page-background");
            expect(colors).not.toHaveProperty("--color-demo-background");
        }
    });

    it("meets text and focus contrast targets in both variants", () => {
        for (const colors of variants) {
            expectContrast(colors, "--color-foreground", "--color-surface", 4.5);
            expectContrast(colors, "--color-muted-foreground", "--color-canvas", 4.5);
            expectContrast(colors, "--color-input-foreground", "--color-input-background", 4.5);
            expectContrast(colors, "--color-focus-indicator", "--color-input-background", 3);
            expectContrast(colors, "--color-disabled-foreground", "--color-disabled-background", 4.5);
            expectContrast(colors, "--color-primary-foreground", "--color-primary", 4.5);
        }
    });

    it("keeps resting and hovered control borders darker than their control surface", () => {
        for (const colors of variants) {
            expectDarker(colors, "--color-border-control", "--color-input-background");
            expectDarker(colors, "--color-border-control-hover", "--color-input-background");
            expectDarker(colors, "--color-disabled-border", "--color-disabled-background");
        }
        expectDarker(annaThemeColors.light, "--color-border-control-hover", "--color-border-control");
        expectDarker(annaThemeColors.dark, "--color-border-control", "--color-border-control-hover");
        expectContrast(annaThemeColors.light, "--color-border-control", "--color-input-background", 3);
    });

    it("keeps overlay surfaces darker than the controls they contain", () => {
        for (const colors of variants) {
            expectDarker(colors, "--color-surface-overlay", "--color-input-background");
            expectDarker(colors, "--color-surface-overlay", "--color-surface-raised");
        }
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
