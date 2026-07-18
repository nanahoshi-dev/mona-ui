import type { ThemeStyle } from "../models/Theme";
import type { ThemeColorRegistration } from "../models/ThemeDefinition";
import { annaThemeColors } from "../definitions/anna-theme-colors";
import { monaThemeColors } from "../definitions/mona-theme-colors";
import { DefaultThemeColorStrategy } from "./default-theme-color.strategy";

describe("DefaultThemeColorStrategy", () => {
    it("resolves the built-in Mona light and dark colors", () => {
        const strategy = new DefaultThemeColorStrategy([]);

        expect(strategy.resolve("mona", "light")).toEqual(monaThemeColors.light);
        expect(strategy.resolve("mona", "dark")).toEqual(monaThemeColors.dark);
    });

    it("resolves Anna dark and rejects an unsupported Anna light variant", () => {
        const strategy = new DefaultThemeColorStrategy([]);

        expect(strategy.resolve("anna", "dark")).toEqual(annaThemeColors.dark);
        expect(() => strategy.resolve("anna", "light")).toThrowError(
            'Mona UI theme "anna" does not support the "light" variant.'
        );
    });

    it("keeps Anna overrides isolated from Mona", () => {
        const strategy = new DefaultThemeColorStrategy([
            { theme: "anna", colors: { dark: { "--color-primary": "anna-override" } } }
        ]);

        expect(strategy.resolve("anna", "dark")["--color-primary"]).toBe("anna-override");
        expect(strategy.resolve("mona", "dark")["--color-primary"]).toBe(monaThemeColors.dark["--color-primary"]);
    });

    it("returns a fresh record without mutating the built-in definition", () => {
        const strategy = new DefaultThemeColorStrategy([]);
        const before = { ...monaThemeColors.light };
        const first = strategy.resolve("mona", "light");
        const second = strategy.resolve("mona", "light");

        expect(first).not.toBe(monaThemeColors.light);
        expect(first).not.toBe(second);
        expect(monaThemeColors.light).toEqual(before);
    });

    it("applies common additions to both variants", () => {
        const strategy = new DefaultThemeColorStrategy([
            {
                theme: "mona",
                colors: { common: { "--color-brand": "rebeccapurple" } }
            }
        ]);

        expect(strategy.resolve("mona", "light")["--color-brand"]).toBe("rebeccapurple");
        expect(strategy.resolve("mona", "dark")["--color-brand"]).toBe("rebeccapurple");
    });

    it("keeps variant-only additions scoped to their variant", () => {
        const strategy = new DefaultThemeColorStrategy([
            {
                theme: "mona",
                colors: {
                    light: { "--color-light-only": "white" },
                    dark: { "--color-dark-only": "black" }
                }
            }
        ]);

        expect(strategy.resolve("mona", "light")).toHaveProperty("--color-light-only", "white");
        expect(strategy.resolve("mona", "light")).not.toHaveProperty("--color-dark-only");
        expect(strategy.resolve("mona", "dark")).toHaveProperty("--color-dark-only", "black");
        expect(strategy.resolve("mona", "dark")).not.toHaveProperty("--color-light-only");
    });

    it("lets variant values overwrite common and built-in values", () => {
        const strategy = new DefaultThemeColorStrategy([
            {
                theme: "mona",
                colors: {
                    common: { "--color-primary": "common" },
                    dark: { "--color-primary": "dark" }
                }
            }
        ]);

        expect(strategy.resolve("mona", "light")["--color-primary"]).toBe("common");
        expect(strategy.resolve("mona", "dark")["--color-primary"]).toBe("dark");
    });

    it("lets later registrations overwrite earlier registrations", () => {
        const registrations: readonly ThemeColorRegistration[] = [
            { theme: "mona", colors: { common: { "--color-primary": "first" } } },
            { theme: "mona", colors: { common: { "--color-primary": "second" } } }
        ];

        expect(new DefaultThemeColorStrategy(registrations).resolve("mona", "light")["--color-primary"]).toBe("second");
    });

    it("ignores registrations for a nonmatching theme", () => {
        const strategy = new DefaultThemeColorStrategy([
            {
                theme: "future-theme" as ThemeStyle,
                colors: { common: { "--color-primary": "ignored" } }
            }
        ]);

        expect(strategy.resolve("mona", "light")["--color-primary"]).toBe(monaThemeColors.light["--color-primary"]);
    });

    it("throws a descriptive error for a missing built-in theme", () => {
        const strategy = new DefaultThemeColorStrategy([]);

        expect(() => strategy.resolve("future-theme" as ThemeStyle, "light")).toThrowError(
            'No built-in color definition exists for Mona UI theme "future-theme".'
        );
    });
});
