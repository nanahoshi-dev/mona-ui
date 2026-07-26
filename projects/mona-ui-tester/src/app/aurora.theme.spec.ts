import { ThemeService, provideThemeFamily, provideThemeOptions } from "@nanahoshi/mona-ui/theme";
import { TestBed } from "@angular/core/testing";
import { auroraTheme } from "./aurora.theme";

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
