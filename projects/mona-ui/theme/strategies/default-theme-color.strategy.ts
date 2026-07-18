import { builtInThemeColors } from "../definitions/built-in-theme-colors";
import type { ThemeStyle, ThemeVariant } from "../models/Theme";
import type { ThemeColorRegistration, ThemeColors, ThemeDefinition } from "../models/ThemeDefinition";
import type { ThemeColorStrategy } from "./theme-color.strategy";

export class DefaultThemeColorStrategy implements ThemeColorStrategy {
    readonly #registrations: readonly ThemeColorRegistration[];

    public constructor(registrations: readonly ThemeColorRegistration[]) {
        this.#registrations = registrations;
    }

    public resolve(theme: ThemeStyle, variant: ThemeVariant): ThemeColors {
        const definition: ThemeDefinition | undefined = builtInThemeColors[theme];
        if (!definition) {
            throw new Error(`No built-in color definition exists for Mona UI theme "${theme}".`);
        }

        const variantColors = definition[variant];
        if (!variantColors) {
            throw new Error(`Mona UI theme "${theme}" does not support the "${variant}" variant.`);
        }

        const resolved: Record<`--color-${string}`, string> = { ...variantColors };

        for (const registration of this.#registrations) {
            if (registration.theme !== theme) {
                continue;
            }

            Object.assign(resolved, registration.colors.common, registration.colors[variant]);
        }

        return resolved;
    }
}
