import { converter, parse, wcagContrast } from "culori";
import type { ThemeVariant } from "../models/Theme";
import type { ThemeColorPaletteSeeds, ThemeColors } from "../models/ThemeDefinition";
import { generateThemeColorPalette } from "./generate-theme-color-palette";

const variants = ["light", "dark"] as const satisfies readonly ThemeVariant[];
const toOklch = converter("oklch");

describe("generateThemeColorPalette", () => {
    it.each(["#7c3aed", "rgb(124 58 237)", "hsl(262 83% 58%)", "oklch(54.1% 0.247 293.01)"])(
        "accepts the CSS color %s",
        seed => {
            const palette = generateThemeColorPalette({ primary: seed });

            for (const variant of variants) {
                expect(palette[variant]["--color-primary"]).toMatch(/^oklch\(/);
            }
        }
    );

    it("generates primary emphasis without replacing omitted roles", () => {
        const palette = generateThemeColorPalette({ primary: "rebeccapurple" });

        for (const variant of variants) {
            expect(palette[variant]).toEqual(
                expect.objectContaining({
                    "--color-primary": expect.stringMatching(/^oklch\(/),
                    "--color-accent": expect.stringMatching(/^oklch\(/),
                    "--color-selected": "var(--color-accent)",
                    "--color-focus-indicator": "var(--color-primary)"
                })
            );
            expect(palette[variant]).not.toHaveProperty("--color-secondary");
            expect(palette[variant]).not.toHaveProperty("--color-error");
        }
    });

    it("generates every optional role independently", () => {
        const seeds: ThemeColorPaletteSeeds = {
            primary: "#7444c3",
            secondary: "#49627d",
            success: "#2f855a",
            error: "#c2413b",
            warning: "#b36b00",
            info: "#2f6fbd"
        };
        const palette = generateThemeColorPalette(seeds);

        for (const variant of variants) {
            for (const role of Object.keys(seeds)) {
                expect(palette[variant]).toHaveProperty(`--color-${role}`);
                expect(palette[variant]).toHaveProperty(`--color-${role}-selected`);
                expect(palette[variant]).toHaveProperty(`--color-${role}-subtle`);
                expect(palette[variant]).toHaveProperty(`--color-${role}-border`);
            }
        }
    });

    it("is deterministic, immutable, and returns fresh objects", () => {
        const seeds = Object.freeze({ primary: "oklch(40.08% 0.107 308.49)" });
        const first = generateThemeColorPalette(seeds);
        const second = generateThemeColorPalette(seeds);

        expect(first).toEqual(second);
        expect(first).not.toBe(second);
        expect(first.light).not.toBe(second.light);
        expect(Object.isFrozen(first)).toBe(true);
        expect(Object.isFrozen(first.light)).toBe(true);
        expect(seeds.primary).toBe("oklch(40.08% 0.107 308.49)");
    });

    it("gamut maps saturated and achromatic seeds to finite sRGB colors", () => {
        for (const seed of ["oklch(70% 0.45 140)", "oklch(50% 0 0)"]) {
            const palette = generateThemeColorPalette({ primary: seed });

            for (const variant of variants) {
                for (const value of Object.values(palette[variant]).filter(isOklch)) {
                    const parsed = parse(value);
                    const converted = parsed ? toOklch(parsed) : undefined;
                    expect(converted).toBeDefined();
                    expect(Number.isFinite(converted?.l)).toBe(true);
                    expect(Number.isFinite(converted?.c)).toBe(true);
                    expect(Number.isFinite(converted?.h)).toBe(true);
                }
            }
        }
    });

    it.each([
        ["primary", "not-a-color", /Invalid primary theme color seed/],
        ["error", "rgb(255 0 0 / 50%)", /Invalid error theme color seed: translucent/]
    ] as const)("rejects an invalid %s seed", (role, value, expected) => {
        const seeds = { primary: "#7444c3", [role]: value } satisfies ThemeColorPaletteSeeds;

        expect(() => generateThemeColorPalette(seeds)).toThrow(expected);
    });

    it("maintains accessible text, surface, border, and focus contrast", () => {
        const palette = generateThemeColorPalette({
            primary: "oklch(40.08% 0.107 308.49)",
            success: "oklch(62% 0.14 150)",
            error: "oklch(58% 0.19 25)",
            warning: "oklch(72% 0.14 75)",
            info: "oklch(60% 0.15 255)"
        });

        for (const variant of variants) {
            const colors = palette[variant];
            const surface = variant === "light" ? "oklch(99% 0.003 270)" : "oklch(19% 0.012 270)";
            for (const role of ["primary", "success", "error", "warning", "info"] as const) {
                expectContrast(colors, `--color-${role}-foreground`, `--color-${role}`, 4.5);
                expectContrast(colors, `--color-${role}-subtle-foreground`, `--color-${role}-subtle`, 4.5);
                expect(wcagContrast(colors[`--color-${role}`], surface)).toBeGreaterThanOrEqual(3);
                expectContrast(colors, `--color-${role}-border`, `--color-${role}-subtle`, 3);
            }
            expect(wcagContrast(colors["--color-primary"], surface)).toBeGreaterThanOrEqual(3);
        }
    });

    it("creates monotonic hover and active tones for each variant", () => {
        const palette = generateThemeColorPalette({ primary: "#7444c3" });
        const light = palette.light;
        const dark = palette.dark;

        expect(lightness(light["--color-primary-hover"])).toBeLessThan(lightness(light["--color-primary"]));
        expect(lightness(light["--color-primary-active"])).toBeLessThan(lightness(light["--color-primary-hover"]));
        expect(darknessOrder(dark)).toEqual(["base", "hover", "active"]);
    });

    it("generates a selected tone that is visibly distinct from the resting solid tone", () => {
        const palette = generateThemeColorPalette({
            primary: "#7444c3",
            secondary: "#49627d",
            success: "#2f855a",
            error: "#c2413b",
            warning: "#b36b00",
            info: "#2f6fbd"
        });

        for (const variant of variants) {
            for (const role of ["primary", "secondary", "success", "error", "warning", "info"] as const) {
                expect(palette[variant][`--color-${role}-selected`]).toBe(palette[variant][`--color-${role}-active`]);
                expect(palette[variant][`--color-${role}-selected`]).not.toBe(palette[variant][`--color-${role}`]);
            }
        }
    });
});

function expectContrast(
    colors: ThemeColors,
    foreground: `--color-${string}`,
    background: `--color-${string}`,
    minimum: number
): void {
    expect(wcagContrast(colors[foreground], colors[background])).toBeGreaterThanOrEqual(minimum);
}

function lightness(value: string): number {
    const parsed = parse(value);
    const converted = parsed ? toOklch(parsed) : undefined;
    if (!converted) {
        throw new Error(`Could not parse generated color: ${value}`);
    }
    return converted.l;
}

function darknessOrder(colors: ThemeColors): readonly string[] {
    const states = [
        ["base", colors["--color-primary"]],
        ["hover", colors["--color-primary-hover"]],
        ["active", colors["--color-primary-active"]]
    ] as const;
    return [...states].sort((left, right) => lightness(left[1]) - lightness(right[1])).map(([name]) => name);
}

function isOklch(value: string): boolean {
    return value.startsWith("oklch(");
}
