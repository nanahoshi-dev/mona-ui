import { computed, DOCUMENT, inject, Injectable, signal } from "@angular/core";
import type { ThemeSelection } from "../models/Theme";
import { flattenThemeProfile, type ThemeProfile, type ThemeVariable } from "../models/ThemeDefinition";
import { THEME_OPTIONS, THEME_STRATEGY } from "../tokens/theme.tokens";

@Injectable({ providedIn: "root" })
export class ThemeService {
    readonly #document = inject(DOCUMENT);
    readonly #options = inject(THEME_OPTIONS);
    readonly #strategy = inject(THEME_STRATEGY);
    readonly #initialSelection = normalizeSelection(this.#options.initialTheme);
    readonly #activeSelection = signal<ThemeSelection>(this.#initialSelection);
    readonly #activeProfile = signal<ThemeProfile>(this.#strategy.resolve(this.#initialSelection));
    readonly #appliedVariables = new Set<ThemeVariable>();

    public readonly profile = this.#activeProfile.asReadonly();
    public readonly selection = this.#activeSelection.asReadonly();
    public readonly themeName = computed(() => this.#activeSelection().name);
    public readonly themeVariant = computed(() => this.#activeSelection().variant);

    public constructor() {
        this.#applyTheme(this.#initialSelection, this.#activeProfile());
    }

    public setTheme(selection: ThemeSelection): void {
        const normalized = normalizeSelection(selection);
        const profile = this.#strategy.resolve(normalized);
        this.#applyTheme(normalized, profile);
        this.#activeProfile.set(profile);
        this.#activeSelection.set(normalized);
    }

    #applyTheme(selection: ThemeSelection, profile: ThemeProfile): void {
        const root = this.#document.documentElement;
        if (!root) {
            return;
        }

        const variables = flattenThemeProfile(profile);
        for (const previousName of this.#appliedVariables) {
            if (!(previousName in variables)) {
                root.style.removeProperty(previousName);
            }
        }
        for (const [name, value] of Object.entries(variables)) {
            root.style.setProperty(name, value);
        }

        root.setAttribute("data-mona-theme", selection.name);
        root.setAttribute("data-mona-variant", selection.variant);
        this.#appliedVariables.clear();
        for (const name of Object.keys(variables)) {
            this.#appliedVariables.add(name as ThemeVariable);
        }
    }
}

function normalizeSelection(selection: ThemeSelection): ThemeSelection {
    return Object.freeze({ name: selection.name, variant: selection.variant });
}
