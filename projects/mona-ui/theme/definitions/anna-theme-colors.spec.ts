import { converter, parse, wcagContrast } from "culori";
import type { ThemeColors } from "../models/ThemeDefinition";
import { annaThemeColors } from "./anna-theme-colors";
import { monaThemeColors } from "./mona-theme-colors";

describe("annaThemeColors", () => {
    const variants = ["light", "dark"] as const;

    it("ships a light and a dark variant, each with the complete Mona runtime color contract", () => {
        expect(Object.keys(annaThemeColors.light).sort()).toEqual(Object.keys(monaThemeColors.light).sort());
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
                "--color-selected": "var(--color-primary)",
                "--color-focus-indicator": "#BC94DB"
            })
        );
        expect(annaThemeColors.dark).not.toBe(monaThemeColors.dark);
    });

    it("gives the light variant gray surfaces, off-white controls, and the same violet", () => {
        expect(annaThemeColors.light).toEqual(
            expect.objectContaining({
                "--color-canvas": "#E9E9EC",
                "--color-surface": "#EFEFF1",
                "--color-surface-muted": "#E4E4E7",
                "--color-input-background": "#F7F7F9",
                "--color-hover": "#EAEAED",
                "--color-primary": "#583573",
                "--color-selected": "#E9DDF2",
                "--color-selected-border": "var(--color-primary)",
                "--color-focus-indicator": "#76489C"
            })
        );
        expect(annaThemeColors.light).not.toBe(monaThemeColors.light);
    });

    it.each(variants)("defines scrollbars and aliases, and no tester-owned colors, in %s", variant => {
        const colors = annaThemeColors[variant];

        expect(colors).toEqual(
            expect.objectContaining({
                "--color-background": "var(--color-surface)",
                "--color-popover": "var(--color-surface-overlay)",
                "--color-scrollbar-thumb-focus": "var(--color-focus-indicator)"
            })
        );
        expect(colors).not.toHaveProperty("--color-page-background");
        expect(colors).not.toHaveProperty("--color-demo-background");
    });

    it.each(variants)("meets text and focus contrast targets in %s", variant => {
        const colors = annaThemeColors[variant];

        expectContrast(colors, "--color-foreground", "--color-surface", 4.5);
        expectContrast(colors, "--color-muted-foreground", "--color-canvas", 4.5);
        expectContrast(colors, "--color-input-foreground", "--color-input-background", 4.5);
        expectContrast(colors, "--color-focus-indicator", "--color-input-background", 3);
        expectContrast(colors, "--color-disabled-foreground", "--color-disabled-background", 4.5);
        expectContrast(colors, "--color-primary-foreground", "--color-primary", 4.5);
        expectContrast(colors, "--color-selected-foreground", "--color-selected", 4.5);
    });

    it("keeps resting, hovered, and disabled borders darker than their surfaces", () => {
        const colors = annaThemeColors.dark;

        expectDarker(colors, "--color-border-control", "--color-input-background");
        expectDarker(colors, "--color-border-control-hover", "--color-input-background");
        expectDarker(colors, "--color-disabled-border", "--color-disabled-background");
        expectDarker(colors, "--color-border-control", "--color-border-control-hover");
    });

    it("darkens a light field's border on hover", () => {
        const colors = annaThemeColors.light;

        expectDarker(colors, "--color-border-control", "--color-input-background");
        expectDarker(colors, "--color-border-control-hover", "--color-border-control");
        expectDarker(colors, "--color-disabled-border", "--color-disabled-background");
    });

    it.each(variants)("gives %s controls a fill brighter than every surface", variant => {
        for (const surface of [
            "--color-canvas",
            "--color-surface",
            "--color-surface-muted",
            "--color-surface-raised",
            "--color-surface-overlay"
        ] as const) {
            expectDarker(annaThemeColors[variant], surface, "--color-input-background");
        }
    });

    it("lifts dark controls further on hover and press, and darkens light ones", () => {
        expectDarker(annaThemeColors.dark, "--color-input-background", "--color-hover");
        expectDarker(annaThemeColors.dark, "--color-hover", "--color-active");
        expectDarker(annaThemeColors.light, "--color-hover", "--color-input-background");
        expectDarker(annaThemeColors.light, "--color-active", "--color-hover");
    });

    it("retains the dark theme's sunken overlay hierarchy", () => {
        expectDarker(annaThemeColors.dark, "--color-surface-overlay", "--color-input-background");
        expectDarker(annaThemeColors.dark, "--color-surface-overlay", "--color-surface-raised");
    });

    it.each(variants)("maps cards to the raised surface with accessible foreground text in %s", variant => {
        const colors = annaThemeColors[variant];

        expect(colors["--color-card"]).toBe("var(--color-surface-raised)");
        expect(colors["--color-card-foreground"]).toBe("var(--color-foreground)");
        expectContrast(colors, "--color-card-foreground", "--color-card", 4.5);
    });

    it.each(variants)(
        "uses neutral sidebar hover and the selected violet pair for the current destination in %s",
        variant => {
            const colors = annaThemeColors[variant];

            expect(colors).toMatchObject({
                "--color-sidebar": "var(--color-surface-muted)",
                "--color-sidebar-primary": "var(--color-selected)",
                "--color-sidebar-primary-foreground": "var(--color-selected-foreground)",
                "--color-sidebar-accent": "var(--color-hover)",
                "--color-sidebar-accent-foreground": "var(--color-foreground)"
            });
            expectContrast(colors, "--color-sidebar-foreground", "--color-sidebar", 4.5);
            expectContrast(colors, "--color-sidebar-accent-foreground", "--color-sidebar-accent", 4.5);
            expectContrast(colors, "--color-sidebar-primary-foreground", "--color-sidebar-primary", 4.5);
            expectContrast(colors, "--color-sidebar-ring", "--color-sidebar", 3);
        }
    );
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
