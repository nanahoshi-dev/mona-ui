import { monaTheme } from "../definitions/mona-theme";
import type { ThemeFamilyRegistration, ThemeProfile } from "../models/ThemeDefinition";
import { DefaultThemeStrategy } from "./default-theme.strategy";

describe("checking a custom theme", () => {
    const family = (colors: Record<string, string>, name = "custom"): ThemeFamilyRegistration => ({
        name,
        variants: {
            light: {
                ...monaTheme.variants.light,
                colors: { ...monaTheme.variants.light.colors, ...colors }
            }
        }
    });

    afterEach(() => vi.restoreAllMocks());

    it.each(["bad theme", "bad\ttheme", " padded"])("rejects %j as a name", name => {
        expect(() => new DefaultThemeStrategy([family({}, name)], [])).toThrow("cannot contain whitespace");
    });

    it("warns about a value that isn't a color", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

        new DefaultThemeStrategy([family({ "--color-foreground": "banana" })], []);

        expect(warn.mock.calls.flat().join()).toContain('--color-foreground: "banana"');
    });

    it("warns about a pair below what WCAG AA needs", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

        new DefaultThemeStrategy([family({ "--color-focus-indicator": "#ffffff", "--color-surface": "#ffffff" })], []);

        expect(warn.mock.calls.flat().join()).toContain("--color-focus-indicator on --color-surface is 1.00:1");
    });

    it("follows aliases to read a pair", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

        new DefaultThemeStrategy(
            [
                family({
                    "--color-border-control": "var(--color-border-subtle)",
                    "--color-border-subtle": "#ffffff",
                    "--color-input-background": "#ffffff"
                })
            ],
            []
        );

        expect(warn.mock.calls.flat().join()).toContain("--color-border-control on --color-input-background is 1.00:1");
    });

    it("warns about a custom variable that can't be applied", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const registration: ThemeFamilyRegistration = {
            name: "custom",
            variants: { light: { ...monaTheme.variants.light, custom: { "not-a-variable": "1px" } as never } }
        };

        new DefaultThemeStrategy([registration], []);

        expect(warn.mock.calls.flat().join()).toContain('custom variables without "--": not-a-variable');
    });

    it("checks an override's colors too", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

        new DefaultThemeStrategy(
            [],
            [
                {
                    theme: "mona",
                    light: { colors: { "--color-primary-foreground": "#18181b", "--color-primary": "#18181b" } }
                }
            ]
        );

        expect(warn.mock.calls.flat().join()).toContain(
            'Theme "mona" (light): --color-primary-foreground on --color-primary'
        );
    });

    it("leaves alone what it can't read", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

        new DefaultThemeStrategy(
            [
                family({
                    "--color-hover": "color-mix(in oklch, red, blue)",
                    "--color-active": "currentColor",
                    "--color-accent": "var(--brand)"
                })
            ],
            []
        );

        expect(warn).not.toHaveBeenCalled();
    });

    it("says nothing about the built-in themes", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

        new DefaultThemeStrategy([], []);

        expect(warn).not.toHaveBeenCalled();
    });
});

describe("DefaultThemeStrategy", () => {
    it("resolves complete independent built-in profiles", () => {
        const strategy = new DefaultThemeStrategy([], []);

        expect(strategy.resolve({ name: "mona", variant: "light" })).toEqual(monaTheme.variants.light);
        expect(strategy.resolve({ name: "mona", variant: "dark" })).toEqual(monaTheme.variants.dark);
        expect(strategy.resolve({ name: "mona", variant: "light" })).not.toBe(monaTheme.variants.light);
    });

    it("registers a complete single-variant custom family", () => {
        const profile = cloneProfile(monaTheme.variants.dark);
        const strategy = new DefaultThemeStrategy([{ name: "custom", variants: { dark: profile } }], []);

        expect(strategy.resolve({ name: "custom", variant: "dark" })).toEqual(profile);
        expect(() => strategy.resolve({ name: "custom", variant: "light" })).toThrowError(
            'Mona UI theme "custom" does not support the "light" variant.'
        );
    });

    it("rejects duplicate built-in and custom family names", () => {
        const registration = { name: "mona", variants: { light: cloneProfile(monaTheme.variants.light) } };

        expect(() => new DefaultThemeStrategy([registration], [])).toThrowError(
            'Mona UI theme "mona" is already registered.'
        );
    });

    it("rejects duplicate custom family names", () => {
        const registration = { name: "custom", variants: { light: cloneProfile(monaTheme.variants.light) } };

        expect(() => new DefaultThemeStrategy([registration, registration], [])).toThrowError(
            'Mona UI theme "custom" is already registered.'
        );
    });

    it("rejects an incomplete profile", () => {
        const incomplete = {
            ...cloneProfile(monaTheme.variants.light),
            colors: { "--color-primary": "red" }
        } as ThemeProfile;

        expect(() => new DefaultThemeStrategy([{ name: "custom", variants: { light: incomplete } }], [])).toThrowError(
            /missing colors tokens/
        );
    });

    it("requires the semantic card color pair in third-party profiles", () => {
        const {
            "--color-card": _card,
            "--color-card-foreground": _cardForeground,
            ...colors
        } = cloneProfile(monaTheme.variants.light).colors;
        const profile = { ...cloneProfile(monaTheme.variants.light), colors };

        expect(() => new DefaultThemeStrategy([{ name: "custom", variants: { light: profile } }], [])).toThrowError(
            /missing colors tokens.*--color-card.*--color-card-foreground/
        );
    });

    it("requires the complete semantic sidebar color family in third-party profiles", () => {
        const {
            "--color-sidebar": _sidebar,
            "--color-sidebar-foreground": _sidebarForeground,
            "--color-sidebar-primary": _sidebarPrimary,
            "--color-sidebar-primary-foreground": _sidebarPrimaryForeground,
            "--color-sidebar-accent": _sidebarAccent,
            "--color-sidebar-accent-foreground": _sidebarAccentForeground,
            "--color-sidebar-border": _sidebarBorder,
            "--color-sidebar-ring": _sidebarRing,
            ...colors
        } = cloneProfile(monaTheme.variants.light).colors;
        const profile = { ...cloneProfile(monaTheme.variants.light), colors };

        expect(() => new DefaultThemeStrategy([{ name: "custom", variants: { light: profile } }], [])).toThrowError(
            /missing colors tokens.*--color-sidebar.*--color-sidebar-ring/
        );
    });

    it("requires the effect and shape sections for third-party profiles", () => {
        const { effects: _effects, shape: _shape, ...incomplete } = cloneProfile(monaTheme.variants.light);

        expect(
            () =>
                new DefaultThemeStrategy(
                    [{ name: "custom", variants: { light: incomplete as unknown as ThemeProfile } }],
                    []
                )
        ).toThrowError(/missing effects tokens/);
    });

    it("rejects a family with no declared variants", () => {
        const registration = { name: "custom", variants: {} } as ThemeFamilyRegistration;

        expect(() => new DefaultThemeStrategy([registration], [])).toThrowError(
            'Mona UI theme "custom" must define at least one variant.'
        );
    });

    it("applies common and selected-variant overrides in provider order", () => {
        const strategy = new DefaultThemeStrategy(
            [],
            [
                { theme: "mona", common: { colors: { "--color-primary": "common-1" } } },
                {
                    theme: "mona",
                    common: { colors: { "--color-primary": "common-2" } },
                    dark: { colors: { "--color-primary": "dark-2" } }
                },
                { theme: "mona", dark: { colors: { "--color-primary": "dark-3" } } }
            ]
        );

        expect(strategy.resolve({ name: "mona", variant: "light" }).colors["--color-primary"]).toBe("common-2");
        expect(strategy.resolve({ name: "mona", variant: "dark" }).colors["--color-primary"]).toBe("dark-3");
    });

    it("applies effect and shape overrides through the same ordered pipeline", () => {
        const strategy = new DefaultThemeStrategy(
            [],
            [
                {
                    theme: "luna",
                    common: {
                        effects: { "--mona-effect-control-backdrop-filter": "blur(20px)" },
                        shape: { "--radius-md": "0.875rem" }
                    }
                },
                {
                    theme: "luna",
                    dark: {
                        effects: { "--mona-effect-control-backdrop-filter": "blur(22px)" }
                    }
                }
            ]
        );

        expect(
            strategy.resolve({ name: "luna", variant: "light" }).effects["--mona-effect-control-backdrop-filter"]
        ).toBe("blur(20px)");
        expect(
            strategy.resolve({ name: "luna", variant: "dark" }).effects["--mona-effect-control-backdrop-filter"]
        ).toBe("blur(22px)");
        expect(strategy.resolve({ name: "luna", variant: "dark" }).shape["--radius-md"]).toBe("0.875rem");
    });

    it("rejects overrides for unknown targets", () => {
        expect(() => new DefaultThemeStrategy([], [{ theme: "missing", common: {} }])).toThrowError(
            'Cannot override unknown Mona UI theme "missing".'
        );
    });

    it("rejects overrides for variants the target family does not declare", () => {
        const registration = { name: "custom", variants: { dark: cloneProfile(monaTheme.variants.dark) } };

        expect(
            () => new DefaultThemeStrategy([registration], [{ theme: "custom", light: { colors: {} } }])
        ).toThrowError('Cannot override undeclared "light" variant of Mona UI theme "custom".');
    });

    it("preserves non-colliding custom variables", () => {
        const profile = { ...cloneProfile(monaTheme.variants.light), custom: { "--brand-radius": "12px" } };
        const strategy = new DefaultThemeStrategy(
            [{ name: "custom", variants: { light: profile } }],
            [{ theme: "custom", common: { custom: { "--brand-density": "compact" } } }]
        );

        expect(strategy.resolve({ name: "custom", variant: "light" }).custom).toEqual({
            "--brand-radius": "12px",
            "--brand-density": "compact"
        });
    });

    it("rejects custom variables that collide with required tokens", () => {
        const profile = {
            ...cloneProfile(monaTheme.variants.light),
            custom: { "--color-primary": "collision" }
        } satisfies ThemeProfile;

        expect(() => new DefaultThemeStrategy([{ name: "custom", variants: { light: profile } }], [])).toThrowError(
            /custom variables collide with required tokens/
        );
    });

    it("rejects colliding custom variables supplied by overrides", () => {
        expect(
            () =>
                new DefaultThemeStrategy(
                    [],
                    [{ theme: "mona", common: { custom: { "--mona-motion-fast": "collision" } } }]
                )
        ).toThrowError(/custom variables collide with required tokens/);
    });

    it("rejects unsupported runtime variant declarations", () => {
        const registration = {
            name: "custom",
            variants: { sepia: cloneProfile(monaTheme.variants.light) }
        } as unknown as ThemeFamilyRegistration;

        expect(() => new DefaultThemeStrategy([registration], [])).toThrowError(/declares unsupported variants: sepia/);
    });

    it("rejects unknown selections", () => {
        const strategy = new DefaultThemeStrategy([], []);

        expect(() => strategy.resolve({ name: "missing", variant: "dark" })).toThrowError(
            'Unknown Mona UI theme "missing".'
        );
    });
});

function cloneProfile(profile: ThemeProfile): ThemeProfile {
    return {
        colors: { ...profile.colors },
        components: { ...profile.components },
        custom: profile.custom ? { ...profile.custom } : undefined,
        effects: { ...profile.effects },
        motion: { ...profile.motion },
        shape: { ...profile.shape },
        shadows: { ...profile.shadows }
    };
}
