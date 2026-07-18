import { computed, DOCUMENT, inject, Injectable, signal } from "@angular/core";
import type { ThemeId, ThemeStyle, ThemeVariant } from "../models/Theme";
import type { ThemeColorVariable, ThemeColors } from "../models/ThemeDefinition";
import { THEME_COLOR_STRATEGY } from "../tokens/theme-color.tokens";

interface ActiveTheme {
    readonly id: ThemeId;
    readonly style: ThemeStyle;
    readonly variant: ThemeVariant;
}

function parseThemeId(themeId: string): ActiveTheme {
    switch (themeId) {
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
    readonly #appliedVariables = new Set<ThemeColorVariable>();

    public readonly themeId = computed(() => this.#activeTheme().id);
    public readonly theme = computed(() => this.#activeTheme().style);
    public readonly themeVariant = computed(() => this.#activeTheme().variant);

    public constructor() {
        this.#applyThemeColors(this.#strategy.resolve("mona", "light"));
    }

    public setThemeId(themeId: ThemeId): void {
        const nextTheme = parseThemeId(themeId);
        const colors = this.#strategy.resolve(nextTheme.style, nextTheme.variant);

        this.#activeTheme.set(nextTheme);
        this.#applyThemeColors(colors);
    }

    #applyThemeColors(colors: ThemeColors): void {
        const root = this.#document.documentElement;
        if (!root) {
            return;
        }

        for (const previousName of this.#appliedVariables) {
            if (!(previousName in colors)) {
                root.style.removeProperty(previousName);
            }
        }

        for (const [name, value] of Object.entries(colors)) {
            root.style.setProperty(name, value);
        }

        this.#appliedVariables.clear();
        for (const name of Object.keys(colors)) {
            this.#appliedVariables.add(name as ThemeColorVariable);
        }
    }
}
