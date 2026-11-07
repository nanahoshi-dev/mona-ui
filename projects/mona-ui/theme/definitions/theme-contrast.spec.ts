import { wcagContrast } from "culori";
import { findThemeProblems } from "../strategies/theme-validation";
import type { ThemeVariant } from "../models/Theme";
import type { ThemeFamilyRegistration, ThemeProfile } from "../models/ThemeDefinition";
import { builtInThemes } from "./built-in-themes";

type Colors = Readonly<Record<string, string>>;

const profiles: readonly (readonly [string, ThemeVariant, ThemeProfile])[] = (
    Object.values(builtInThemes) as readonly ThemeFamilyRegistration[]
).flatMap(theme =>
    (Object.entries(theme.variants) as [ThemeVariant, ThemeProfile][]).map(
        ([variant, profile]) => [theme.name, variant, profile] as const
    )
);

/** Follows `var(--color-x)` through the profile. Anything else, such as Luna's glass surfaces, is left out. */
function resolve(colors: Colors, token: string): string | null {
    const value = colors[token];
    if (value === undefined) {
        throw new Error(`Unknown token ${token}`);
    }
    const alias = /^var\((--color-[^)]+)\)$/.exec(value);
    if (alias) {
        return resolve(colors, alias[1]);
    }
    return value.includes("var(") ? null : value;
}

function contrast(colors: Colors, first: string, second: string): number {
    const a = resolve(colors, `--color-${first}`);
    const b = resolve(colors, `--color-${second}`);
    return a === null || b === null ? Number.POSITIVE_INFINITY : wcagContrast(a, b);
}

describe("built-in theme contrast", () => {
    describe.each(profiles)("%s %s", (_name, _variant, profile) => {
        const colors: Colors = profile.colors;

        it.each(["input-background", "surface", "canvas", "surface-raised", "surface-overlay", "surface-muted"])(
            "gives a field's border 3:1 on %s",
            surface => {
                expect(contrast(colors, "border-control", surface)).toBeGreaterThanOrEqual(3);
                expect(contrast(colors, "border-control-hover", surface)).toBeGreaterThanOrEqual(3);
            }
        );

        it("strengthens a field's border on hover", () => {
            expect(contrast(colors, "border-control-hover", "input-background")).toBeGreaterThan(
                contrast(colors, "border-control", "input-background")
            );
        });

        it.each(["surface", "surface-muted", "header-background", "input-background", "hover", "active", "selected"])(
            "keeps muted text at 4.5:1 on %s",
            surface => {
                expect(contrast(colors, "muted-foreground", surface)).toBeGreaterThanOrEqual(4.5);
            }
        );

        it.each(["surface", "selected", "sidebar-primary", "accent"])(
            "keeps the focus indicator at 3:1 on %s",
            surface => {
                expect(contrast(colors, "focus-indicator", surface)).toBeGreaterThanOrEqual(3);
            }
        );

        it.each(["surface", "selected"])("keeps the selected border at 3:1 on %s", surface => {
            expect(contrast(colors, "selected-border", surface)).toBeGreaterThanOrEqual(3);
        });

        it.each(["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"])("keeps %s at 3:1 on the surface", token => {
            expect(contrast(colors, token, "surface")).toBeGreaterThanOrEqual(3);
        });

        it("keeps the scrollbar thumb at 3:1 on its track", () => {
            expect(contrast(colors, "scrollbar-thumb", "scrollbar-track")).toBeGreaterThanOrEqual(3);
        });

        it("keeps disabled text at 4.5:1 on its background", () => {
            expect(contrast(colors, "disabled-foreground", "disabled-background")).toBeGreaterThanOrEqual(4.5);
        });

        it("has nothing for the development check to report", () => {
            expect(findThemeProblems(_name, _variant, profile)).toEqual([]);
        });

        it("draws what's only a fill at 3:1 on the surface", () => {
            const indicator = profile.custom?.["--mona-indicator-color"] ?? "var(--color-primary)";
            const value = resolve({ ...colors, "--color-indicator": indicator }, "--color-indicator");
            const surface = resolve(colors, "--color-surface");
            expect(value).not.toBeNull();
            expect(surface).not.toBeNull();
            expect(wcagContrast(value as string, surface as string)).toBeGreaterThanOrEqual(3);
        });
    });

    it("keeps text on Anna's indicator readable", () => {
        const custom = builtInThemes.anna.variants.dark.custom ?? {};
        const color = resolve(
            { ...builtInThemes.anna.variants.dark.colors, "--color-indicator": custom["--mona-indicator-color"] },
            "--color-indicator"
        );
        expect(wcagContrast(custom["--mona-indicator-foreground"], color as string)).toBeGreaterThanOrEqual(4.5);
    });
});
