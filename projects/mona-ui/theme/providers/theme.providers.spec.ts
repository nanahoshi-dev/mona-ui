import { TestBed } from "@angular/core/testing";
import { monaTheme } from "../definitions/mona-theme";
import { THEME_FAMILY_REGISTRATIONS, THEME_OPTIONS, THEME_OVERRIDE_REGISTRATIONS } from "../tokens/theme.tokens";
import { provideThemeColorPalette, provideThemeFamily, provideThemeOptions, provideThemeOverrides } from "./theme.providers";

describe("theme providers", () => {
    afterEach(() => TestBed.resetTestingModule());

    it("registers families and overrides as ordered multi providers", () => {
        const family = { name: "custom", variants: { dark: monaTheme.variants.dark } };
        const first = { theme: "mona", common: { colors: { "--color-primary": "first" } } };
        const second = { theme: "mona", dark: { colors: { "--color-primary": "second" } } };
        TestBed.configureTestingModule({
            providers: [provideThemeFamily(family), provideThemeOverrides(first), provideThemeOverrides(second)]
        });

        expect(TestBed.inject(THEME_FAMILY_REGISTRATIONS)).toEqual([family]);
        expect(TestBed.inject(THEME_OVERRIDE_REGISTRATIONS)).toEqual([first, second]);
    });

    it("configures the initial selection", () => {
        TestBed.configureTestingModule({
            providers: [provideThemeOptions({ initialTheme: { name: "anna", variant: "dark" } })]
        });

        expect(TestBed.inject(THEME_OPTIONS)).toEqual({ initialTheme: { name: "anna", variant: "dark" } });
    });

    it("defaults to Mona Light", () => {
        TestBed.configureTestingModule({});

        expect(TestBed.inject(THEME_OPTIONS)).toEqual({ initialTheme: { name: "mona", variant: "light" } });
    });

    it("contributes generated palettes through the override pipeline", () => {
        TestBed.configureTestingModule({
            providers: [provideThemeColorPalette({ theme: "mona", seeds: { primary: "#0057b8" } })]
        });

        const [registration] = TestBed.inject(THEME_OVERRIDE_REGISTRATIONS);

        expect(registration.theme).toBe("mona");
        expect(registration.light?.colors?.["--color-primary"]).toBeDefined();
        expect(registration.dark?.colors?.["--color-primary"]).toBeDefined();
    });
});
