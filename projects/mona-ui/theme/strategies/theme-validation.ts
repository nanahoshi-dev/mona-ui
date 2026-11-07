import { parse, wcagContrast } from "culori";
import type { ThemeVariant } from "../models/Theme";
import type { ThemeProfile } from "../models/ThemeDefinition";

/** The pairs a theme has to get right for the library to meet WCAG AA, and the contrast each needs. */
const contrastPairs: readonly (readonly [`--color-${string}`, `--color-${string}`, number])[] = [
    ["--color-foreground", "--color-surface", 4.5],
    ["--color-muted-foreground", "--color-surface", 4.5],
    ["--color-input-foreground", "--color-input-background", 4.5],
    ["--color-primary-foreground", "--color-primary", 4.5],
    ["--color-border-control", "--color-input-background", 3],
    ["--color-focus-indicator", "--color-surface", 3],
    ["--color-selected-border", "--color-surface", 3]
];

/**
 * What's wrong with a theme's colors, as sentences. Only for development: an invalid value fails silently where
 * it's used, far from where it was written. Values this can't read, such as `color-mix()` or a variable from
 * outside the color tokens, aren't reported, because they may well be right.
 */
export function findThemeProblems(name: string, variant: ThemeVariant, profile: ThemeProfile): readonly string[] {
    const colors = profile.colors;
    const problems: string[] = [];

    const unreadable = Object.entries(colors)
        .filter(([, value]) => !value.includes("(") && value.toLowerCase() !== "currentcolor" && !parse(value))
        .map(([token, value]) => `${token}: "${value}"`);
    if (unreadable.length > 0) {
        problems.push(`Theme "${name}" (${variant}) has values that aren't colors: ${unreadable.join(", ")}.`);
    }

    for (const [foreground, background, minimum] of contrastPairs) {
        const first = resolveColor(colors, foreground);
        const second = resolveColor(colors, background);
        if (first && second && parse(first) && parse(second)) {
            const contrast = wcagContrast(first, second);
            if (contrast < minimum) {
                problems.push(
                    `Theme "${name}" (${variant}): ${foreground} on ${background} is ${contrast.toFixed(2)}:1, and WCAG AA needs ${minimum}:1.`
                );
            }
        }
    }

    const custom = Object.keys(profile.custom ?? {}).filter(key => !key.startsWith("--"));
    if (custom.length > 0) {
        problems.push(`Theme "${name}" (${variant}) has custom variables without "--": ${custom.join(", ")}.`);
    }
    return problems;
}

function resolveColor(colors: Readonly<Record<string, string>>, token: string): string | undefined {
    const seen = new Set<string>();
    let value = colors[token];
    while (value !== undefined && !seen.has(value)) {
        seen.add(value);
        const alias = /^var\((--[^),]+)\)$/.exec(value.trim());
        if (!alias) {
            return value;
        }
        value = colors[alias[1]];
    }
    return undefined;
}
