import { computed, DestroyRef, DOCUMENT, inject, Injectable, signal } from "@angular/core";
import type { ThemeSelection } from "../models/Theme";
import {
    flattenThemeProfile,
    type GeneratedThemeColorPalette,
    type ThemeColorPaletteSeeds,
    type ThemeColors,
    type ThemeEffectLevel,
    type ThemeProfile,
    type ThemeVariable,
    type ThemeVariables
} from "../models/ThemeDefinition";
import { THEME_OPTIONS, THEME_STRATEGY } from "../tokens/theme.tokens";
import { generateThemeColorPalette } from "../utils/generate-theme-color-palette";

@Injectable({ providedIn: "root" })
export class ThemeService {
    readonly #appliedVariables = new Set<ThemeVariable>();
    readonly #document = inject(DOCUMENT);
    readonly #destroyRef = inject(DestroyRef);
    readonly #initialSelection = normalizeSelection(inject(THEME_OPTIONS).initialTheme);
    readonly #strategy = inject(THEME_STRATEGY);

    readonly #activeSelection = signal<ThemeSelection>(this.#initialSelection);
    readonly #activeProfile = signal<ThemeProfile>(this.#strategy.resolve(this.#initialSelection));
    readonly #activeColorPaletteSeeds = signal<ThemeColorPaletteSeeds | null>(null);
    readonly #transparencyQuery = this.#document.defaultView?.matchMedia?.("(prefers-reduced-transparency: reduce)");
    #runtimeColorPalette: GeneratedThemeColorPalette | null = null;

    /** The consumer-provided seeds for the active runtime color palette, or `null` when provider defaults are active. */
    public readonly colorPaletteSeeds = this.#activeColorPaletteSeeds.asReadonly();
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

    /** Removes the runtime color palette and restores the registered profile and provider overrides. */
    public clearColorPalette(): void {
        const selection = this.#activeSelection();
        const profile = this.#strategy.resolve(selection);

        this.#applyTheme(selection, profile);
        this.#runtimeColorPalette = null;
        this.#activeProfile.set(profile);
        this.#activeColorPaletteSeeds.set(null);
    }

    /**
     * Applies a runtime-generated semantic color palette after all registered profile overrides.
     * The palette remains active across theme and light/dark switches until cleared.
     */
    public setColorPalette(seeds: ThemeColorPaletteSeeds): void {
        const normalizedSeeds = Object.freeze({ ...seeds });
        const palette = generateThemeColorPalette(normalizedSeeds);
        const selection = this.#activeSelection();
        const baseProfile = this.#strategy.resolve(selection);
        const profile = applyColorPalette(baseProfile, palette[selection.variant]);

        this.#applyTheme(selection, profile);
        this.#runtimeColorPalette = palette;
        this.#activeProfile.set(profile);
        this.#activeColorPaletteSeeds.set(normalizedSeeds);
    }

    /** Updates only the runtime primary seed while retaining any other active runtime seeds. */
    public setPrimaryColor(primary: string): void {
        this.setColorPalette({ ...(this.#activeColorPaletteSeeds() ?? {}), primary });
    }

    public setTheme(selection: ThemeSelection): void {
        const normalized = normalizeSelection(selection);
        const profile = this.#resolveProfile(normalized);
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

    #resolveProfile(selection: ThemeSelection): ThemeProfile {
        const profile = this.#strategy.resolve(selection);
        const palette = this.#runtimeColorPalette;
        return palette ? applyColorPalette(profile, palette[selection.variant]) : profile;
    }
}

type TransparencyMode = "full" | "reduced";

const effectLevels: readonly ThemeEffectLevel[] = ["control", "raised", "overlay"];

function applyColorPalette(profile: ThemeProfile, colors: ThemeColors): ThemeProfile {
    return Object.freeze({
        ...profile,
        colors: Object.freeze({ ...profile.colors, ...colors })
    });
}

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
