import { builtInThemes } from "../definitions/built-in-themes";
import type { ThemeSelection, ThemeVariant } from "../models/Theme";
import {
    flattenThemeProfile,
    type ThemeFamilyRegistration,
    type ThemeOverrideRegistration,
    type ThemeProfile,
    type ThemeProfileOverrides
} from "../models/ThemeDefinition";
import type { ThemeStrategy } from "./theme.strategy";

export class DefaultThemeStrategy implements ThemeStrategy {
    readonly #overrides: readonly ThemeOverrideRegistration[];
    readonly #themes = new Map<string, ThemeFamilyRegistration>();

    public constructor(
        registrations: readonly ThemeFamilyRegistration[],
        overrides: readonly ThemeOverrideRegistration[]
    ) {
        for (const theme of Object.values(builtInThemes)) {
            for (const [variant, profile] of getDefinedVariants(theme)) {
                validateProfile(theme.name, variant, profile);
            }
            this.#themes.set(theme.name, theme);
        }
        for (const registration of registrations) {
            this.#register(registration);
        }
        for (const override of overrides) {
            const family = this.#themes.get(override.theme);
            if (!family) {
                throw new Error(`Cannot override unknown Mona UI theme "${override.theme}".`);
            }
            for (const variant of ["light", "dark"] as const) {
                if (override[variant] && !family.variants[variant]) {
                    throw new Error(
                        `Cannot override undeclared "${variant}" variant of Mona UI theme "${override.theme}".`
                    );
                }
            }
            validateCustomVariables(override.theme, override.common?.custom);
            validateCustomVariables(override.theme, override.light?.custom);
            validateCustomVariables(override.theme, override.dark?.custom);
        }
        this.#overrides = overrides;
    }

    public resolve(selection: ThemeSelection): ThemeProfile {
        const family = this.#themes.get(selection.name);
        if (!family) {
            throw new Error(`Unknown Mona UI theme "${selection.name}".`);
        }

        const profile = family.variants[selection.variant];
        if (!profile) {
            throw new Error(`Mona UI theme "${selection.name}" does not support the "${selection.variant}" variant.`);
        }

        let resolved = cloneProfile(profile);
        for (const override of this.#overrides) {
            if (override.theme === selection.name) {
                resolved = applyOverrides(resolved, override.common);
                resolved = applyOverrides(resolved, override[selection.variant]);
            }
        }
        return resolved;
    }

    #register(registration: ThemeFamilyRegistration): void {
        if (!registration.name.trim()) {
            throw new Error("Mona UI theme names cannot be empty.");
        }
        if (this.#themes.has(registration.name)) {
            throw new Error(`Mona UI theme "${registration.name}" is already registered.`);
        }

        const variants = getDefinedVariants(registration);
        if (variants.length === 0) {
            throw new Error(`Mona UI theme "${registration.name}" must define at least one variant.`);
        }
        for (const [variant, profile] of variants) {
            validateProfile(registration.name, variant, profile);
        }
        this.#themes.set(registration.name, registration);
    }
}

function getDefinedVariants(registration: ThemeFamilyRegistration): readonly [ThemeVariant, ThemeProfile][] {
    const entries = Object.entries(registration.variants);
    const unknownVariants = entries.filter(([variant]) => variant !== "light" && variant !== "dark");
    if (unknownVariants.length > 0) {
        throw new Error(
            `Mona UI theme "${registration.name}" declares unsupported variants: ${unknownVariants.map(([variant]) => variant).join(", ")}.`
        );
    }
    return (entries as readonly [ThemeVariant, ThemeProfile | undefined][]).filter(
        (entry): entry is [ThemeVariant, ThemeProfile] => entry[1] !== undefined
    );
}

function applyOverrides(profile: ThemeProfile, overrides: ThemeProfileOverrides | undefined): ThemeProfile {
    if (!overrides) {
        return profile;
    }
    const custom =
        profile.custom || overrides.custom ? Object.freeze({ ...profile.custom, ...overrides.custom }) : undefined;
    return {
        colors: Object.freeze({ ...profile.colors, ...overrides.colors }),
        components: Object.freeze({ ...profile.components, ...overrides.components }),
        custom,
        motion: Object.freeze({ ...profile.motion, ...overrides.motion }),
        shadows: Object.freeze({ ...profile.shadows, ...overrides.shadows })
    };
}

function cloneProfile(profile: ThemeProfile): ThemeProfile {
    return applyOverrides(profile, {});
}

function validateProfile(name: string, variant: ThemeVariant, profile: ThemeProfile): void {
    const reference = builtInThemes.mona.variants.light;
    for (const section of ["colors", "shadows", "motion", "components"] as const) {
        const values = profile[section];
        const missing = values
            ? Object.keys(reference[section]).filter(key => !(key in values))
            : Object.keys(reference[section]);
        if (missing.length > 0) {
            throw new Error(
                `Mona UI theme "${name}" is missing ${section} tokens for the "${variant}" variant: ${missing.join(", ")}.`
            );
        }
    }

    validateCustomVariables(name, profile.custom);
}

function validateCustomVariables(name: string, custom: ThemeProfile["custom"]): void {
    const requiredVariables = new Set(Object.keys(flattenThemeProfile(builtInThemes.mona.variants.light)));
    const collisions = Object.keys(custom ?? {}).filter(key => requiredVariables.has(key));
    if (collisions.length > 0) {
        throw new Error(
            `Mona UI theme "${name}" custom variables collide with required tokens: ${collisions.join(", ")}.`
        );
    }
}
