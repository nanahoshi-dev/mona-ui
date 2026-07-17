import { builtInThemeColors } from "../definitions/built-in-theme-colors";
import type { ThemeStyle, ThemeVariant } from "../models/Theme";
import type { ThemeColorRegistration, ThemeColors } from "../models/ThemeDefinition";
import type { ThemeColorStrategy } from "./theme-color.strategy";

export class DefaultThemeColorStrategy implements ThemeColorStrategy {
    readonly #registrations: readonly ThemeColorRegistration[];

    public constructor(registrations: readonly ThemeColorRegistration[]) {
        this.#registrations = registrations;
    }

    public resolve(theme: ThemeStyle, variant: ThemeVariant): ThemeColors {
        const definition = builtInThemeColors[theme];
        if (!definition) {
            throw new Error(`No built-in color definition exists for Mona UI theme "${theme}".`);
        }

        const resolved: Record<`--color-${string}`, string> = { ...definition[variant] };

        for (const registration of this.#registrations) {
            if (registration.theme !== theme) {
                continue;
            }

            Object.assign(resolved, registration.colors.common, registration.colors[variant]);
        }

        return resolved;
    }
}
