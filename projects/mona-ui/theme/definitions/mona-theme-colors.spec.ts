import { converter, parse, wcagContrast } from "culori";
import type { ThemeColors } from "../models/ThemeDefinition";
import { monaThemeColors } from "./mona-theme-colors";

describe("monaThemeColors", () => {
    it("keeps light and dark variants on the same color contract", () => {
        expect(Object.keys(monaThemeColors.dark).sort()).toEqual(Object.keys(monaThemeColors.light).sort());
    });

    it("uses only color variable names", () => {
        for (const colors of Object.values(monaThemeColors)) {
            expect(Object.keys(colors).every(name => name.startsWith("--color-"))).toBe(true);
        }
    });

    it("defines every required semantic group", () => {
        const requiredTokens = [
            "--color-canvas",
            "--color-surface",
            "--color-surface-muted",
            "--color-surface-raised",
            "--color-surface-overlay",
            "--color-foreground",
            "--color-muted-foreground",
            "--color-input-background",
            "--color-input-foreground",
            "--color-border-subtle",
            "--color-border",
            "--color-border-control",
            "--color-border-control-hover",
            "--color-focus-indicator",
            "--color-disabled-foreground",
            "--color-disabled-background",
            "--color-disabled-border",
            "--color-hover",
            "--color-active",
            "--color-accent",
            "--color-accent-foreground",
            "--color-accent-hover",
            "--color-accent-active"
        ];

        for (const role of ["primary", "secondary", "success", "error", "warning", "info"]) {
            requiredTokens.push(
                `--color-${role}`,
                `--color-${role}-foreground`,
                `--color-${role}-hover`,
                `--color-${role}-active`,
                `--color-${role}-selected`,
                `--color-${role}-subtle`,
                `--color-${role}-subtle-foreground`,
                `--color-${role}-border`
            );
        }

        for (const colors of Object.values(monaThemeColors)) {
            expect(Object.keys(colors)).toEqual(expect.arrayContaining(requiredTokens));
        }
    });

    it("keeps legacy names as aliases of canonical roles", () => {
        const aliases = {
            "--color-background": "var(--color-surface)",
            "--color-background-dark": "var(--color-surface-muted)",
            "--color-header-foreground": "var(--color-foreground)",
            "--color-input-border": "var(--color-border-control)",
            "--color-input": "var(--color-border-control)",
            "--color-popover": "var(--color-surface-overlay)",
            "--color-popover-foreground": "var(--color-foreground)",
            "--color-muted": "var(--color-surface-muted)",
            "--color-destructive": "var(--color-error)",
            "--color-destructive-foreground": "var(--color-error-foreground)",
            "--color-selected": "var(--color-accent)"
        };

        for (const colors of Object.values(monaThemeColors)) {
            expect(colors).toEqual(expect.objectContaining(aliases));
        }
    });

    it("provides dark-specific overlays, muted colors, charts, and scrollbars", () => {
        for (const token of [
            "--color-surface-overlay",
            "--color-muted-foreground",
            "--color-disabled-background",
            "--color-chart-1",
            "--color-scrollbar-thumb",
            "--color-scrollbar-track"
        ] as const) {
            expect(resolveColor(monaThemeColors.dark, token)).not.toBe(resolveColor(monaThemeColors.light, token));
        }
    });

    it("keeps the built-in identity and interaction palette zinc-neutral", () => {
        const neutralTokens = [
            "--color-canvas",
            "--color-surface",
            "--color-surface-muted",
            "--color-surface-raised",
            "--color-surface-overlay",
            "--color-foreground",
            "--color-muted-foreground",
            "--color-input-background",
            "--color-border-subtle",
            "--color-border",
            "--color-border-control",
            "--color-border-control-hover",
            "--color-hover",
            "--color-active",
            "--color-primary",
            "--color-secondary",
            "--color-accent",
            "--color-chart-1",
            "--color-chart-2",
            "--color-chart-3",
            "--color-chart-4",
            "--color-chart-5",
            "--color-scrollbar-thumb"
        ] as const;

        for (const colors of Object.values(monaThemeColors)) {
            for (const token of neutralTokens) {
                expect(chroma(resolveColor(colors, token)), token).toBeLessThanOrEqual(0.02);
            }
        }
    });

    it("meets text, interaction, and focus contrast targets", () => {
        for (const colors of Object.values(monaThemeColors)) {
            expectContrast(colors, "--color-foreground", "--color-surface", 4.5);
            expectContrast(colors, "--color-muted-foreground", "--color-canvas", 4.5);
            expectContrast(colors, "--color-input-foreground", "--color-input-background", 4.5);
            // Resting boundaries stay intentionally quiet; hover strengthens them and focus remains WCAG-visible.
            expectContrast(colors, "--color-border-control", "--color-input-background", 1.3);
            expect(colorContrast(colors, "--color-border-control-hover", "--color-input-background")).toBeGreaterThan(
                colorContrast(colors, "--color-border-control", "--color-input-background")
            );
            expectContrast(colors, "--color-focus-indicator", "--color-input-background", 3);
            expectContrast(colors, "--color-disabled-foreground", "--color-disabled-background", 4.5);

            for (const role of ["primary", "secondary", "success", "error", "warning", "info"] as const) {
                expectContrast(colors, `--color-${role}-foreground`, `--color-${role}`, 4.5);
                expectContrast(colors, `--color-${role}-subtle-foreground`, `--color-${role}-subtle`, 4.5);
                expectContrast(colors, `--color-${role}-border`, `--color-${role}-subtle`, 3);
            }
        }
    });

    it("does not include tester-owned colors", () => {
        for (const colors of Object.values(monaThemeColors)) {
            expect(colors).not.toHaveProperty("--color-page-background");
            expect(colors).not.toHaveProperty("--color-demo-background");
            expect(colors).not.toHaveProperty("--page-background");
        }
    });
});

function expectContrast(
    colors: ThemeColors,
    foreground: `--color-${string}`,
    background: `--color-${string}`,
    minimum: number
): void {
    expect(colorContrast(colors, foreground, background)).toBeGreaterThanOrEqual(minimum);
}

function colorContrast(
    colors: ThemeColors,
    foreground: `--color-${string}`,
    background: `--color-${string}`
): number {
    return wcagContrast(resolveColor(colors, foreground), resolveColor(colors, background));
}

function resolveColor(colors: ThemeColors, name: `--color-${string}`): string {
    const value = colors[name];
    const alias = /^var\((--color-[^)]+)\)$/.exec(value);
    return alias?.[1] ? resolveColor(colors, alias[1] as `--color-${string}`) : value;
}

function chroma(value: string): number {
    const color = converter("oklch")(parse(value));

    if (!color) {
        throw new Error(`Expected a parsable color, received "${value}".`);
    }

    return color.c;
}
