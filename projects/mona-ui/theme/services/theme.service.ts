import { computed, DOCUMENT, inject, Injectable, signal } from "@angular/core";
import { builtInThemeShadows } from "../definitions/built-in-theme-shadows";
import type { ThemeId, ThemeStyle, ThemeVariant } from "../models/Theme";
import type {
    ThemeColors,
    ThemeShadowDefinition,
    ThemeShadows,
    ThemeVariable,
    ThemeVariables
} from "../models/ThemeDefinition";
import { THEME_COLOR_STRATEGY } from "../tokens/theme-color.tokens";

interface ActiveTheme {
    readonly id: ThemeId;
    readonly style: ThemeStyle;
    readonly variant: ThemeVariant;
}

function parseThemeId(themeId: string): ActiveTheme {
    switch (themeId) {
        case "anna-light":
            return { id: themeId, style: "anna", variant: "light" };
        case "anna-dark":
            return { id: themeId, style: "anna", variant: "dark" };
        case "mona-light":
            return { id: themeId, style: "mona", variant: "light" };
        case "mona-dark":
            return { id: themeId, style: "mona", variant: "dark" };
        default:
            throw new Error(`Unknown Mona UI theme identifier: "${themeId}".`);
    }
}

@Injectable({
    providedIn: "root"
})
export class ThemeService {
    readonly #document = inject(DOCUMENT);
    readonly #strategy = inject(THEME_COLOR_STRATEGY);
    readonly #activeTheme = signal<ActiveTheme>(parseThemeId("mona-light"));
    readonly #appliedVariables = new Set<ThemeVariable>();

    public readonly themeId = computed(() => this.#activeTheme().id);
    public readonly theme = computed(() => this.#activeTheme().style);
    public readonly themeVariant = computed(() => this.#activeTheme().variant);

    public constructor() {
        this.#applyThemeVariables(this.#resolveThemeVariables("mona", "light"));
    }

    public setThemeId(themeId: ThemeId): void {
        const nextTheme = parseThemeId(themeId);
        const variables = this.#resolveThemeVariables(nextTheme.style, nextTheme.variant);

        this.#activeTheme.set(nextTheme);
        this.#applyThemeVariables(variables);
    }

    #applyThemeVariables(variables: ThemeVariables): void {
        const root = this.#document.documentElement;
        if (!root) {
            return;
        }

        for (const previousName of this.#appliedVariables) {
            if (!(previousName in variables)) {
                root.style.removeProperty(previousName);
            }
        }

        for (const [name, value] of Object.entries(variables)) {
            root.style.setProperty(name, value);
        }

        this.#appliedVariables.clear();
        for (const name of Object.keys(variables)) {
            this.#appliedVariables.add(name as ThemeVariable);
        }
    }

    #resolveThemeVariables(theme: ThemeStyle, variant: ThemeVariant): ThemeVariables {
        const colors: ThemeColors = this.#strategy.resolve(theme, variant);
        const definition: ThemeShadowDefinition = builtInThemeShadows[theme];
        const shadows: ThemeShadows | undefined = definition[variant];
        if (!shadows) {
            throw new Error(`Mona UI theme "${theme}" does not define shadows for the "${variant}" variant.`);
        }
        return { ...colors, ...shadows };
    }
}
