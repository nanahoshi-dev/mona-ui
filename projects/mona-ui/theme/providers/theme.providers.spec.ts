import { TestBed } from "@angular/core/testing";
import { annaTheme } from "../definitions/anna-theme";
import { monaTheme } from "../definitions/mona-theme";
import { THEME_FAMILY_REGISTRATIONS, THEME_OPTIONS, THEME_OVERRIDE_REGISTRATIONS } from "../tokens/theme.tokens";
import { ThemeService } from "../services/theme.service";
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

    it("generates a palette for a theme with only one variant", () => {
        TestBed.configureTestingModule({
            providers: [
                provideThemeOptions({ initialTheme: { name: "anna", variant: "dark" } }),
                provideThemeColorPalette({ theme: "anna", seeds: { primary: "#0057b8" } })
            ]
        });

        const service = TestBed.inject(ThemeService);

        expect(service.selection()).toEqual({ name: "anna", variant: "dark" });
        expect(service.profile().colors["--color-primary"]).not.toBe(annaTheme.variants.dark.colors["--color-primary"]);
    });

    it("still refuses an explicit override of a variant a theme doesn't have", () => {
        TestBed.configureTestingModule({
            providers: [
                provideThemeOptions({ initialTheme: { name: "anna", variant: "dark" } }),
                provideThemeOverrides({ theme: "anna", light: { colors: { "--color-primary": "#000000" } } })
            ]
        });

        expect(() => TestBed.inject(ThemeService)).toThrow('Cannot override undeclared "light" variant');
    });

    it("still refuses a palette for a theme that doesn't exist", () => {
        TestBed.configureTestingModule({
            providers: [provideThemeColorPalette({ theme: "nope", seeds: { primary: "#0057b8" } })]
        });

        expect(() => TestBed.inject(ThemeService)).toThrow('Cannot override unknown Mona UI theme "nope"');
    });
});
