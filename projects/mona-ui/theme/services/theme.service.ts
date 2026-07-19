import { computed, DestroyRef, DOCUMENT, inject, Injectable, signal } from "@angular/core";
import type { ThemeSelection } from "../models/Theme";
import {
    flattenThemeProfile,
    type ThemeEffectLevel,
    type ThemeProfile,
    type ThemeVariable,
    type ThemeVariables
} from "../models/ThemeDefinition";
import { THEME_OPTIONS, THEME_STRATEGY } from "../tokens/theme.tokens";

@Injectable({ providedIn: "root" })
export class ThemeService {
    readonly #document = inject(DOCUMENT);
    readonly #destroyRef = inject(DestroyRef);
    readonly #options = inject(THEME_OPTIONS);
    readonly #strategy = inject(THEME_STRATEGY);
    readonly #initialSelection = normalizeSelection(this.#options.initialTheme);
    readonly #activeSelection = signal<ThemeSelection>(this.#initialSelection);
    readonly #activeProfile = signal<ThemeProfile>(this.#strategy.resolve(this.#initialSelection));
    readonly #appliedVariables = new Set<ThemeVariable>();
    readonly #transparencyQuery = this.#document.defaultView?.matchMedia?.("(prefers-reduced-transparency: reduce)");

    public readonly profile = this.#activeProfile.asReadonly();
    public readonly selection = this.#activeSelection.asReadonly();
    public readonly themeName = computed(() => this.#activeSelection().name);
    public readonly themeVariant = computed(() => this.#activeSelection().variant);

    public constructor() {
        this.#applyTheme(this.#initialSelection, this.#activeProfile());
        const query = this.#transparencyQuery;
        if (query) {
            const onPreferenceChange = (): void => this.#applyTheme(this.#activeSelection(), this.#activeProfile());
            query.addEventListener("change", onPreferenceChange);
            this.#destroyRef.onDestroy(() => query.removeEventListener("change", onPreferenceChange));
        }
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

        const transparency = this.#getTransparencyMode();
        const variables = getEffectiveVariables(profile, transparency);
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
        root.setAttribute("data-mona-transparency", transparency);
        this.#appliedVariables.clear();
        for (const name of Object.keys(variables)) {
            this.#appliedVariables.add(name as ThemeVariable);
        }
    }

    #getTransparencyMode(): TransparencyMode {
        const css = this.#document.defaultView?.CSS;
        const supportsBackdropFilter =
            css?.supports("backdrop-filter", "blur(1px)") === true ||
            css?.supports("-webkit-backdrop-filter", "blur(1px)") === true;
        return supportsBackdropFilter && this.#transparencyQuery?.matches !== true ? "full" : "reduced";
    }
}

type TransparencyMode = "full" | "reduced";

const effectLevels: readonly ThemeEffectLevel[] = ["control", "raised", "overlay"];

function getEffectiveVariables(profile: ThemeProfile, transparency: TransparencyMode): ThemeVariables {
    const variables: Record<ThemeVariable, string> = { ...flattenThemeProfile(profile) };
    if (transparency === "full") {
        return variables;
    }

    for (const level of effectLevels) {
        variables[`--mona-effect-${level}-background-color`] =
            profile.effects[`--mona-effect-${level}-fallback-background-color`];
        variables[`--mona-effect-${level}-background-image`] = "none";
        variables[`--mona-effect-${level}-backdrop-filter`] = "none";
    }
    return variables;
}

function normalizeSelection(selection: ThemeSelection): ThemeSelection {
    return Object.freeze({ name: selection.name, variant: selection.variant });
}
