import { TestBed } from "@angular/core/testing";
import type { ThemeColorRegistration, ThemeColors } from "../models/ThemeDefinition";
import { THEME_COLOR_REGISTRATIONS, THEME_COLOR_STRATEGY } from "../tokens/theme-color.tokens";
import { provideThemeColorPalette, provideThemeColors } from "./theme-color.providers";

describe("provideThemeColors", () => {
    afterEach(() => TestBed.resetTestingModule());

    it("contributes registrations as an ordered multi-provider", () => {
        const first: ThemeColorRegistration = {
            theme: "mona",
            colors: { common: { "--color-first": "first" } }
        };
        const second: ThemeColorRegistration = {
            theme: "mona",
            colors: { common: { "--color-second": "second" } }
        };

        TestBed.configureTestingModule({
            providers: [provideThemeColors(first), provideThemeColors(second)]
        });

        expect(TestBed.inject(THEME_COLOR_REGISTRATIONS)).toEqual([first, second]);
    });

    it("feeds registrations into the default strategy in declaration order", () => {
        TestBed.configureTestingModule({
            providers: [
                provideThemeColors({
                    theme: "mona",
                    colors: { common: { "--color-primary": "first" } }
                }),
                provideThemeColors({
                    theme: "mona",
                    colors: { dark: { "--color-primary": "second" } }
                })
            ]
        });

        const strategy = TestBed.inject(THEME_COLOR_STRATEGY);
        expect(strategy.resolve("mona", "light")["--color-primary"]).toBe("first");
        expect(strategy.resolve("mona", "dark")["--color-primary"]).toBe("second");
    });

    it("applies Anna Dark overrides without affecting Mona", () => {
        TestBed.configureTestingModule({
            providers: [
                provideThemeColors({
                    theme: "anna",
                    colors: { dark: { "--color-primary": "anna-dark-override" } }
                })
            ]
        });

        const strategy = TestBed.inject(THEME_COLOR_STRATEGY);
        expect(strategy.resolve("anna", "dark")["--color-primary"]).toBe("anna-dark-override");
        expect(strategy.resolve("mona", "dark")["--color-primary"]).not.toBe("anna-dark-override");
    });

    it("does not let an Anna Light override create an unsupported built-in variant", () => {
        TestBed.configureTestingModule({
            providers: [
                provideThemeColors({
                    theme: "anna",
                    colors: { light: { "--color-primary": "anna-light-override" } }
                })
            ]
        });

        expect(() => TestBed.inject(THEME_COLOR_STRATEGY).resolve("anna", "light")).toThrowError(
            'Mona UI theme "anna" does not support the "light" variant.'
        );
    });

    it("does not mutate the supplied registration", () => {
        const registration = Object.freeze({
            theme: "mona" as const,
            colors: Object.freeze({
                common: Object.freeze({ "--color-brand": "plum" })
            })
        });

        TestBed.configureTestingModule({ providers: [provideThemeColors(registration)] });

        expect(TestBed.inject(THEME_COLOR_REGISTRATIONS)[0]).toBe(registration);
        expect(registration.colors.common["--color-brand"]).toBe("plum");
    });

    it("rejects unrelated CSS variables at compile time", () => {
        const colors = {
            // @ts-expect-error Only --color-* properties are accepted by the public color API.
            "--border-radius": "4px"
        } satisfies ThemeColors;

        expect(colors["--border-radius"]).toBe("4px");
    });

    it("registers generated colors through the ordered multi-provider", () => {
        TestBed.configureTestingModule({
            providers: [
                provideThemeColorPalette({ theme: "mona", seeds: { primary: "#7444c3" } }),
                provideThemeColors({
                    theme: "mona",
                    colors: { common: { "--color-primary": "explicit" } }
                })
            ]
        });

        const registrations = TestBed.inject(THEME_COLOR_REGISTRATIONS);
        expect(registrations).toHaveLength(2);
        expect(registrations[0]?.colors.light?.["--color-primary"]).toMatch(/^oklch\(/);
        expect(TestBed.inject(THEME_COLOR_STRATEGY).resolve("mona", "dark")["--color-primary"]).toBe("explicit");
    });
});
