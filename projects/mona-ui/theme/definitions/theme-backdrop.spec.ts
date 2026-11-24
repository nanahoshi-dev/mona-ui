import { DefaultThemeStrategy } from "../strategies/default-theme.strategy";
import { builtInThemes } from "./built-in-themes";

const halfBackground = "color-mix(in oklab, var(--color-background) 50%, transparent)";

describe("built-in theme backdrops", () => {
    it("dims the page behind a modal with half the background, and blurs it slightly, in every variant", () => {
        for (const [name, theme] of Object.entries(builtInThemes)) {
            for (const [variant, profile] of Object.entries(theme.variants)) {
                expect(profile.effects, `${name} ${variant}`).toMatchObject({
                    "--mona-effect-backdrop-background-color": halfBackground,
                    "--mona-effect-backdrop-fallback-background-color": halfBackground,
                    "--mona-effect-backdrop-background-image": "none",
                    "--mona-effect-backdrop-backdrop-filter": "blur(4px)"
                });
            }
        }
    });

    it("lets an override turn the blur off and keep the dim", () => {
        const strategy = new DefaultThemeStrategy(
            [],
            [{ theme: "mona", common: { effects: { "--mona-effect-backdrop-backdrop-filter": "none" } } }]
        );

        for (const variant of ["light", "dark"] as const) {
            const { effects } = strategy.resolve({ name: "mona", variant });

            expect(effects["--mona-effect-backdrop-backdrop-filter"]).toBe("none");
            expect(effects["--mona-effect-backdrop-background-color"]).toBe(halfBackground);
        }
    });
});
