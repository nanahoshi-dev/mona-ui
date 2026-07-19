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
                "--color-canvas": "#F7F7F9",
                "--color-surface": "#FFFFFF",
                "--color-surface-muted": "#E4E4E8",
                "--color-surface-overlay": "#FFFFFF",
                "--color-input-background": "#ECECEF",
                "--color-border-subtle": "#0000001A",
                "--color-border": "#00000026",
                "--color-border-control": "#00000033",
                "--color-border-control-hover": "#00000047",
                "--color-disabled-background": "#FAFAFB",
                "--color-disabled-border": "#0000001F",
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
                "--color-scrollbar-track": "#E4E4E8"
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
        expect(alpha(resolveColor(annaThemeColors.light, "--color-border-control-hover"))).toBeGreaterThan(
            alpha(resolveColor(annaThemeColors.light, "--color-border-control"))
        );
        expectDarker(annaThemeColors.dark, "--color-border-control", "--color-border-control-hover");
        expect(resolveColor(annaThemeColors.light, "--color-border-control")).toBe("#00000033");
    });

    it("makes disabled light controls visibly quieter than enabled controls", () => {
        expectLighter(annaThemeColors.light, "--color-disabled-background", "--color-input-background");
        expect(alpha(resolveColor(annaThemeColors.light, "--color-disabled-border"))).toBeLessThan(
            alpha(resolveColor(annaThemeColors.light, "--color-border-control"))
        );
        expectContrast(annaThemeColors.light, "--color-disabled-foreground", "--color-disabled-background", 4.5);
    });

    it("uses gray inset controls and bright overlays in light mode", () => {
        expectDarker(annaThemeColors.light, "--color-input-background", "--color-canvas");
        expectDarker(annaThemeColors.light, "--color-input-background", "--color-surface");
        expectLighter(annaThemeColors.light, "--color-surface", "--color-canvas");
        expectLighter(annaThemeColors.light, "--color-surface-overlay", "--color-input-background");
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

function alpha(color: string): number {
    return parse(color)?.alpha ?? 1;
}

function resolveColor(colors: ThemeColors, name: `--color-${string}`): string {
    const value = colors[name];
    const alias = /^var\((--color-[^)]+)\)$/.exec(value);
    return alias?.[1] ? resolveColor(colors, alias[1] as `--color-${string}`) : value;
}

function expectDarker(colors: ThemeColors, darker: `--color-${string}`, lighter: `--color-${string}`): void {
    expectRelativeLightness(colors, darker, lighter, "less than");
}

function expectLighter(colors: ThemeColors, lighter: `--color-${string}`, darker: `--color-${string}`): void {
    expectRelativeLightness(colors, lighter, darker, "greater than");
}

function expectRelativeLightness(
    colors: ThemeColors,
    first: `--color-${string}`,
    second: `--color-${string}`,
    relation: "less than" | "greater than"
): void {
    const toOklch = converter("oklch");
    const firstColor = toOklch(parse(resolveColor(colors, first)));
    const secondColor = toOklch(parse(resolveColor(colors, second)));

    if (!firstColor || !secondColor) {
        throw new Error(`Expected parsable colors for ${first} and ${second}.`);
    }

    if (relation === "less than") {
        expect(firstColor.l).toBeLessThan(secondColor.l);
    } else {
        expect(firstColor.l).toBeGreaterThan(secondColor.l);
    }
}
