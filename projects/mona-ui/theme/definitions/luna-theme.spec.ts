import { converter, parse, wcagContrast } from "culori";
import { builtInThemes } from "./built-in-themes";
import { annaTheme } from "./anna-theme";
import { lunaTheme } from "./luna-theme";
import { monaTheme } from "./mona-theme";
import type { ThemeColors, ThemeEffects } from "../models/ThemeDefinition";

describe("Luna theme", () => {
    it("registers complete independent light and dark profiles", () => {
        expect(builtInThemes.luna).toBe(lunaTheme);
        expect(lunaTheme.variants.light).not.toBe(lunaTheme.variants.dark);

        for (const variant of [lunaTheme.variants.light, lunaTheme.variants.dark]) {
            expect(Object.keys(variant.colors).sort()).toEqual(Object.keys(monaTheme.variants.light.colors).sort());
            expect(Object.keys(variant.effects).sort()).toEqual(Object.keys(monaTheme.variants.light.effects).sort());
            expect(Object.keys(variant.shape).sort()).toEqual(Object.keys(monaTheme.variants.light.shape).sort());
            expect(Object.keys(variant.components).sort()).toEqual(
                Object.keys(monaTheme.variants.light.components).sort()
            );
        }
    });

    it("uses the Luna radius and material hierarchy in both variants", () => {
        for (const profile of [lunaTheme.variants.light, lunaTheme.variants.dark]) {
            expect(profile.shape).toEqual({
                "--radius-sm": "0.5rem",
                "--radius-md": "0.75rem",
                "--radius-lg": "1rem"
            });
            expect(profile.effects["--mona-effect-control-backdrop-filter"]).toBe("blur(16px) saturate(140%)");
            expect(profile.effects["--mona-effect-raised-backdrop-filter"]).toBe("blur(24px) saturate(150%)");
            expect(profile.effects["--mona-effect-overlay-backdrop-filter"]).toBe("blur(32px) saturate(165%)");
            expect(profile.components["--mona-menubar-background"]).toBe("var(--mona-effect-raised-background-color)");
            expect(profile.components["--mona-list-background"]).toBe("var(--color-surface)");
        }
    });

    it("keeps Mona and Anna opaque with their existing radius scale", () => {
        for (const profile of [monaTheme.variants.light, monaTheme.variants.dark, annaTheme.variants.dark]) {
            expect(profile.effects["--mona-effect-control-backdrop-filter"]).toBe("none");
            expect(profile.effects["--mona-effect-raised-backdrop-filter"]).toBe("none");
            expect(profile.effects["--mona-effect-overlay-backdrop-filter"]).toBe("none");
            expect(profile.shape).toEqual({
                "--radius-sm": "0.25rem",
                "--radius-md": "0.375rem",
                "--radius-lg": "0.5rem"
            });
        }
    });

    it("keeps text, focus, and material boundaries accessible against opaque fallbacks", () => {
        assertProfileContrast(lunaTheme.variants.light.colors, lunaTheme.variants.light.effects);
        assertProfileContrast(lunaTheme.variants.dark.colors, lunaTheme.variants.dark.effects);
    });

    it("keeps contrast on composited glass over canonical Luna surfaces", () => {
        for (const profile of [lunaTheme.variants.light, lunaTheme.variants.dark]) {
            for (const level of ["control", "raised", "overlay"] as const) {
                const glass = profile.effects[`--mona-effect-${level}-background-color`];
                for (const surface of ["--color-canvas", "--color-surface", "--color-surface-muted"] as const) {
                    const background = composite(glass, resolveColor(profile.colors, surface));
                    expect(
                        contrast(resolveColor(profile.colors, "--color-foreground"), background)
                    ).toBeGreaterThanOrEqual(4.5);
                    expect(
                        contrast(resolveColor(profile.colors, "--color-focus-indicator"), background)
                    ).toBeGreaterThanOrEqual(3);
                }
            }
        }
    });
});

function assertProfileContrast(colors: ThemeColors, effects: ThemeEffects): void {
    for (const level of ["control", "raised", "overlay"] as const) {
        const background = effects[`--mona-effect-${level}-fallback-background-color`];
        expect(
            contrast(resolveColor(colors, "--color-foreground"), background),
            `${level} foreground contrast against ${background}`
        ).toBeGreaterThanOrEqual(4.5);
        expect(
            contrast(resolveColor(colors, "--color-focus-indicator"), background),
            `${level} focus contrast against ${background}`
        ).toBeGreaterThanOrEqual(3);
        const boundary = level === "control" ? "--color-border-control" : "--color-border";
        expect(
            contrast(resolveColor(colors, boundary), background),
            `${level} ${boundary} contrast against ${background}`
        ).toBeGreaterThanOrEqual(3);
    }
}

function resolveColor(colors: ThemeColors, name: `--color-${string}`): string {
    const value = colors[name];
    const alias = /^var\((--color-[^)]+)\)$/.exec(value)?.[1] as `--color-${string}` | undefined;
    return alias ? resolveColor(colors, alias) : value;
}

function contrast(foreground: string, background: string): number {
    const parsedForeground = parse(foreground);
    const parsedBackground = parse(background);
    if (!parsedForeground || !parsedBackground) {
        throw new Error(`Cannot parse contrast pair: ${foreground} / ${background}`);
    }
    return wcagContrast(parsedForeground, parsedBackground);
}

function composite(foreground: string, background: string): string {
    const toRgb = converter("rgb");
    const foregroundRgb = toRgb(parse(foreground));
    const backgroundRgb = toRgb(parse(background));
    if (!foregroundRgb || !backgroundRgb) {
        throw new Error(`Cannot composite color pair: ${foreground} / ${background}`);
    }

    const alpha = foregroundRgb.alpha ?? 1;
    const channel = (front: number, back: number): number => Math.round((front * alpha + back * (1 - alpha)) * 255);
    return `rgb(${channel(foregroundRgb.r, backgroundRgb.r)} ${channel(foregroundRgb.g, backgroundRgb.g)} ${channel(foregroundRgb.b, backgroundRgb.b)})`;
}
