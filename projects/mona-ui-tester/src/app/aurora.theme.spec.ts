import { ThemeService, provideThemeFamily, provideThemeOptions } from "@nanahoshi/mona-ui/theme";
import { TestBed } from "@angular/core/testing";
import { wcagContrast } from "culori";
import { auroraTheme } from "./aurora.theme";

const colors: Readonly<Record<string, string>> = auroraTheme.variants.dark.colors;

/** Follows `var(--color-x)` aliases to the hex value at the end. */
function resolve(token: string): string {
    const value = colors[token];
    if (value === undefined) {
        throw new Error(`Aurora has no ${token}`);
    }
    const alias = /^var\((--color-[^)]+)\)$/.exec(value);
    return alias ? resolve(alias[1]) : value;
}

function contrast(foreground: string, background: string): number {
    return wcagContrast(resolve(`--color-${foreground}`), resolve(`--color-${background}`));
}

describe("Aurora theme profile", () => {
    it("keeps its existing opaque material and radius scale", () => {
        const profile = auroraTheme.variants.dark;

        expect(profile.effects["--mona-effect-control-backdrop-filter"]).toBe("none");
        expect(profile.effects["--mona-effect-raised-backdrop-filter"]).toBe("none");
        expect(profile.effects["--mona-effect-overlay-backdrop-filter"]).toBe("none");
        expect(profile.shape).toEqual({
            "--radius-sm": "0.25rem",
            "--radius-md": "0.375rem",
            "--radius-lg": "0.5rem"
        });
    });

    it("provides the complete card and sidebar color contract", () => {
        const colors = auroraTheme.variants.dark.colors;

        expect(colors).toMatchObject({
            "--color-card": "var(--color-surface-raised)",
            "--color-card-foreground": "var(--color-foreground)",
            "--color-sidebar": "var(--color-surface-muted)",
            "--color-sidebar-primary": "var(--color-selected)",
            "--color-sidebar-primary-foreground": "var(--color-selected-foreground)",
            "--color-sidebar-accent": "var(--color-hover)",
            "--color-sidebar-accent-foreground": "var(--color-foreground)"
        });
    });

    // The pairs the built-in themes are held to in theme-contrast.spec.ts, since the docs site offers Aurora too.
    it.each([
        ["muted-foreground", "surface", 4.5],
        ["muted-foreground", "surface-muted", 4.5],
        ["muted-foreground", "hover", 4.5],
        ["muted-foreground", "active", 4.5],
        ["muted-foreground", "selected", 4.5],
        ["selected-foreground", "selected", 4.5],
        ["focus-indicator", "surface", 3],
        ["focus-indicator", "selected", 3],
        ["focus-indicator", "sidebar-primary", 3],
        ["focus-indicator", "accent", 3],
        ["selected-border", "surface", 3],
        ["selected-border", "selected", 3],
        ["scrollbar-thumb", "scrollbar-track", 3],
        ["disabled-foreground", "disabled-background", 4.5],
        ["border-control-contrast", "surface-raised", 3],
        ["border-control-contrast-hover", "surface-raised", 3]
    ] as const)("keeps %s on %s at %s:1", (foreground, background, minimum) => {
        expect(contrast(foreground, background)).toBeGreaterThanOrEqual(minimum);
    });

    it("registers as a complete third-party theme", () => {
        TestBed.configureTestingModule({
            providers: [
                provideThemeFamily(auroraTheme),
                provideThemeOptions({ initialTheme: { name: "aurora", variant: "dark" } })
            ]
        });

        expect(TestBed.inject(ThemeService).selection()).toEqual({ name: "aurora", variant: "dark" });
    });
});
