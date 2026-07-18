import { clampChroma, converter, parse, wcagContrast, type Oklch } from "culori";
import type {
    GeneratedThemeColorPalette,
    ThemeColorPaletteSeeds,
    ThemeColors,
    ThemeColorVariable
} from "../models/ThemeDefinition";

type PaletteRole = keyof ThemeColorPaletteSeeds;

interface VariantPaletteSettings {
    readonly activeDelta: number;
    readonly baseLightness: number;
    readonly borderLightness: number;
    readonly contrastDirection: -1 | 1;
    readonly hoverDelta: number;
    readonly subtleForegroundLightness: number;
    readonly subtleLightness: number;
    readonly surface: Oklch;
}

const toOklch = converter("oklch");
const roles = ["primary", "secondary", "success", "error", "warning", "info"] as const;
const minimumTextContrast = 4.5;
const minimumBoundaryContrast = 3;
const lightSettings: VariantPaletteSettings = {
    activeDelta: -0.07,
    baseLightness: 0.48,
    borderLightness: 0.64,
    contrastDirection: -1,
    hoverDelta: -0.035,
    subtleForegroundLightness: 0.34,
    subtleLightness: 0.945,
    surface: { mode: "oklch", l: 0.99, c: 0.003, h: 270 }
};
const darkSettings: VariantPaletteSettings = {
    activeDelta: 0.07,
    baseLightness: 0.72,
    borderLightness: 0.58,
    contrastDirection: 1,
    hoverDelta: 0.035,
    subtleForegroundLightness: 0.82,
    subtleLightness: 0.285,
    surface: { mode: "oklch", l: 0.19, c: 0.012, h: 270 }
};

/**
 * Generates accessible light and dark color-role overrides from consumer-provided CSS colors.
 * Seed lightness is treated as source identity; the generated variants use fixed tonal anchors.
 */
export function generateThemeColorPalette(seeds: ThemeColorPaletteSeeds): GeneratedThemeColorPalette {
    const light: Record<ThemeColorVariable, string> = {};
    const dark: Record<ThemeColorVariable, string> = {};

    for (const role of roles) {
        const value = seeds[role];
        if (value === undefined) {
            continue;
        }

        const seed = parseSeed(role, value);
        Object.assign(light, createRolePalette(role, seed, lightSettings));
        Object.assign(dark, createRolePalette(role, seed, darkSettings));

        if (role === "primary") {
            Object.assign(light, createPrimaryEmphasisPalette(seed, lightSettings));
            Object.assign(dark, createPrimaryEmphasisPalette(seed, darkSettings));
        }
    }

    return Object.freeze({
        light: Object.freeze(light) satisfies ThemeColors,
        dark: Object.freeze(dark) satisfies ThemeColors
    });
}

function parseSeed(role: PaletteRole, value: string): Oklch {
    const parsed = parse(value);
    const converted = parsed ? toOklch(parsed) : undefined;

    if (!converted) {
        throw new Error(`Invalid ${role} theme color seed: "${value}". Expected an opaque CSS color.`);
    }

    if ((converted.alpha ?? 1) < 1) {
        throw new Error(`Invalid ${role} theme color seed: translucent colors are not supported.`);
    }

    return mapToSrgb({
        mode: "oklch",
        l: clamp(converted.l, 0, 1),
        c: Math.max(converted.c, 0),
        h: normalizeHue(converted.h ?? 0)
    });
}

function createRolePalette(
    role: PaletteRole,
    seed: Oklch,
    settings: VariantPaletteSettings
): Record<ThemeColorVariable, string> {
    const chroma = Math.min(seed.c, 0.16);
    const hue = seed.h ?? 0;
    const base = fitContrast(
        mapToSrgb({ mode: "oklch", l: settings.baseLightness, c: chroma, h: hue }),
        settings.surface,
        minimumBoundaryContrast,
        settings.contrastDirection
    );
    const foreground = chooseForeground(base, hue);
    const hover = ensureForegroundContrast(
        mapToSrgb({ ...base, l: clamp(base.l + settings.hoverDelta, 0, 1) }),
        foreground,
        settings.contrastDirection
    );
    const active = ensureForegroundContrast(
        mapToSrgb({ ...base, l: clamp(base.l + settings.activeDelta, 0, 1) }),
        foreground,
        settings.contrastDirection
    );
    const subtle = mapToSrgb({
        mode: "oklch",
        l: settings.subtleLightness,
        c: Math.min(chroma * 0.22, 0.04),
        h: hue
    });
    const subtleForeground = fitContrast(
        mapToSrgb({
            mode: "oklch",
            l: settings.subtleForegroundLightness,
            c: Math.min(chroma * 0.8, 0.12),
            h: hue
        }),
        subtle,
        minimumTextContrast,
        settings.contrastDirection
    );
    const border = fitContrast(
        mapToSrgb({
            mode: "oklch",
            l: settings.borderLightness,
            c: Math.min(chroma * 0.55, 0.09),
            h: hue
        }),
        subtle,
        minimumBoundaryContrast,
        settings.contrastDirection
    );
    const prefix = `--color-${role}` as const;

    return {
        [prefix]: formatOklch(base),
        [`${prefix}-foreground`]: formatOklch(foreground),
        [`${prefix}-hover`]: formatOklch(hover),
        [`${prefix}-active`]: formatOklch(active),
        [`${prefix}-selected`]: formatOklch(active),
        [`${prefix}-subtle`]: formatOklch(subtle),
        [`${prefix}-subtle-foreground`]: formatOklch(subtleForeground),
        [`${prefix}-border`]: formatOklch(border)
    };
}

function createPrimaryEmphasisPalette(
    seed: Oklch,
    settings: VariantPaletteSettings
): Record<ThemeColorVariable, string> {
    const isLight = settings.contrastDirection === -1;
    const hue = seed.h ?? 0;
    const chroma = Math.min(seed.c * 0.32, 0.05);
    const accent = mapToSrgb({
        mode: "oklch",
        l: isLight ? 0.925 : 0.31,
        c: chroma,
        h: hue
    });
    const foreground = fitContrast(
        mapToSrgb({
            mode: "oklch",
            l: isLight ? 0.3 : 0.88,
            c: Math.min(seed.c * 0.75, 0.11),
            h: hue
        }),
        accent,
        minimumTextContrast,
        settings.contrastDirection
    );
    const hover = mapToSrgb({ ...accent, l: clamp(accent.l + (isLight ? -0.025 : 0.035), 0, 1) });
    const active = mapToSrgb({ ...accent, l: clamp(accent.l + (isLight ? -0.055 : 0.07), 0, 1) });

    return {
        "--color-accent": formatOklch(accent),
        "--color-accent-foreground": formatOklch(foreground),
        "--color-accent-hover": formatOklch(hover),
        "--color-accent-active": formatOklch(active),
        "--color-accent-dark": "var(--color-accent-active)",
        "--color-selected": "var(--color-accent)",
        "--color-focus-indicator": "var(--color-primary)"
    };
}

function chooseForeground(background: Oklch, hue: number): Oklch {
    const light = mapToSrgb({ mode: "oklch", l: 0.98, c: 0.004, h: hue });
    const dark = mapToSrgb({ mode: "oklch", l: 0.16, c: 0.012, h: hue });
    const preferred = wcagContrast(light, background) >= wcagContrast(dark, background) ? light : dark;
    const direction = preferred === light ? 1 : -1;

    return fitContrast(preferred, background, minimumTextContrast, direction);
}

function ensureForegroundContrast(background: Oklch, foreground: Oklch, direction: -1 | 1): Oklch {
    if (wcagContrast(background, foreground) >= minimumTextContrast) {
        return background;
    }

    return fitContrast(background, foreground, minimumTextContrast, direction);
}

function fitContrast(color: Oklch, background: Oklch, minimum: number, direction: -1 | 1): Oklch {
    let candidate = color;

    for (let index = 0; index < 400 && wcagContrast(candidate, background) < minimum; index++) {
        const lightness = clamp(candidate.l + direction * 0.0025, 0, 1);
        if (lightness === candidate.l) {
            break;
        }
        candidate = mapToSrgb({ ...candidate, l: lightness });
    }

    return candidate;
}

function mapToSrgb(color: Oklch): Oklch {
    const mapped = clampChroma(
        {
            mode: "oklch",
            l: clamp(color.l, 0, 1),
            c: Math.max(color.c, 0),
            h: normalizeHue(color.h ?? 0)
        },
        "oklch",
        "rgb"
    );

    return { ...mapped, alpha: undefined };
}

function formatOklch(color: Oklch): string {
    return `oklch(${(color.l * 100).toFixed(2)}% ${color.c.toFixed(4)} ${normalizeHue(color.h ?? 0).toFixed(2)})`;
}

function normalizeHue(hue: number): number {
    return ((hue % 360) + 360) % 360;
}

function clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(Math.max(value, minimum), maximum);
}
