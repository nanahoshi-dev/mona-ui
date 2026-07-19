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

    it("uses Mona's radius scale and Luna's neutral material hierarchy in both variants", () => {
        for (const profile of [lunaTheme.variants.light, lunaTheme.variants.dark]) {
            expect(profile.shape).toEqual(monaTheme.variants.light.shape);
            expect(profile.effects["--mona-effect-control-backdrop-filter"]).toBe("blur(16px) saturate(110%)");
            expect(profile.effects["--mona-effect-raised-backdrop-filter"]).toBe("blur(22px) saturate(112%)");
            expect(profile.effects["--mona-effect-overlay-backdrop-filter"]).toBe("blur(28px) saturate(115%)");
            expect(profile.components["--mona-menubar-background"]).toBe("var(--mona-effect-raised-background-color)");
            expect(profile.components["--mona-list-background"]).toBe("var(--color-surface)");
            expect(profile.components["--mona-tab-content-background"]).toBe("var(--color-surface)");
        }
    });

    it("uses the Craft-inspired neutral surface ladder and restrained blue accent", () => {
        expect(lunaTheme.variants.light.colors).toMatchObject({
            "--color-canvas": "#fcfcfc",
            "--color-surface": "#ffffff",
            "--color-surface-muted": "#f3f4f5",
            "--color-surface-raised": "#fbfbfb",
            "--color-surface-overlay": "#f9f9fa",
            "--color-foreground": "#252525",
            "--color-primary": "#3f6be2",
            "--color-selected": "#e5ebfb"
        });
        expect(lunaTheme.variants.dark.colors).toMatchObject({
            "--color-canvas": "#151515",
            "--color-surface": "#1b1b1c",
            "--color-surface-muted": "#252527",
            "--color-surface-raised": "#202022",
            "--color-surface-overlay": "#262628"
        });
        expect(lunaTheme.variants.light.effects).toMatchObject({
            "--mona-effect-control-fallback-background-color": "#f3f4f5",
            "--mona-effect-raised-fallback-background-color": "#fbfbfb",
            "--mona-effect-overlay-fallback-background-color": "#f9f9fa"
        });
        expect(lunaTheme.variants.light.components["--mona-tab-list-background"]).toBe("#f5f5f6");
        for (const profile of [lunaTheme.variants.light, lunaTheme.variants.dark]) {
            expect(profile.custom?.["--mona-input-addon-background"]).toBe(
                "color-mix(in srgb, var(--color-input-background), var(--color-foreground) 8%)"
            );
            expect(profile.custom).toMatchObject({
                "--mona-date-popup-calendar-backdrop-filter": "none",
                "--mona-date-popup-calendar-background": "transparent",
                "--mona-date-popup-calendar-background-image": "none",
                "--mona-dropdown-popup-list-background": "transparent"
            });
        }

        const serializedProfiles = JSON.stringify(lunaTheme.variants).toLowerCase();
        expect(serializedProfiles).not.toContain("#7486ff");
        expect(serializedProfiles).not.toContain("#a874ff");
        expect(serializedProfiles).not.toContain("rgb(116 134 255");
    });

    it("keeps glass translucent without glossy images or inset highlights", () => {
        expect(lunaTheme.variants.light.effects["--mona-effect-overlay-background-color"]).toBe(
            "rgb(249 249 250 / 0.72)"
        );
        expect(lunaTheme.variants.dark.effects["--mona-effect-overlay-background-color"]).toBe("rgb(38 38 40 / 0.74)");
        for (const profile of [lunaTheme.variants.light, lunaTheme.variants.dark]) {
            for (const level of ["control", "raised", "overlay"] as const) {
                const image = profile.effects[`--mona-effect-${level}-background-image`];
                expect(image).toBe("none");
            }
            for (const shadow of Object.values(profile.shadows)) {
                expect(shadow).toMatch(/rgb\((?:0 0 0|20 20 20) \/ /);
                expect(shadow).not.toContain("inset");
            }
        }
    });

    it("uses subtle resting boundaries and semantic interaction boundaries", () => {
        expect(lunaTheme.variants.light.colors).toMatchObject({
            "--color-border-subtle": "#eeeeef",
            "--color-border": "#e4e4e6",
            "--color-border-control": "#d5d6d9",
            "--color-selected-border": "#3f6be2"
        });
        expect(lunaTheme.variants.dark.colors).toMatchObject({
            "--color-border-subtle": "#303033",
            "--color-border": "#39393d",
            "--color-border-control": "#494a4f"
        });
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

    it("keeps text and focus indicators accessible against opaque fallbacks", () => {
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
