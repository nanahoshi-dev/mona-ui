import {
    computed,
    DestroyRef,
    DOCUMENT,
    inject,
    Injectable,
    Injector,
    isDevMode,
    signal,
    type Signal,
    type WritableSignal
} from "@angular/core";
import type { ThemeAvailability, ThemeName, ThemePreference, ThemeSelection, ThemeVariant } from "../models/Theme";
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
import type { ThemeStorage } from "../models/ThemeStorage";
import { THEME_OPTIONS, THEME_ROOT, THEME_STORAGE, THEME_STRATEGY } from "../tokens/theme.tokens";
import { generateThemeColorPalette } from "../utils/generate-theme-color-palette";

/** Which service last wrote to an element, so that a second one can be reported and neither clears the other. */
const themeWriters = new WeakMap<HTMLElement, ThemeService>();

@Injectable({ providedIn: "root" })
export class ThemeService {
    readonly #activeColorPaletteSeeds = signal<ThemeColorPaletteSeeds | null>(null);
    readonly #activePreference: WritableSignal<ThemePreference>;
    readonly #activeProfile: WritableSignal<ThemeProfile>;
    readonly #activeSelection: WritableSignal<ThemeSelection>;
    readonly #appliedVariables = new Set<ThemeVariable>();
    readonly #colorSchemeQuery: MediaQueryList | undefined;
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #injector = inject(Injector);
    readonly #options = inject(THEME_OPTIONS);
    readonly #root = inject(THEME_ROOT);
    readonly #storage: ThemeStorage | null;
    readonly #strategy = inject(THEME_STRATEGY);
    readonly #transparencyQuery: MediaQueryList | undefined;
    #knownStored: ThemePreference | null = null;
    #runtimeColorPalette: GeneratedThemeColorPalette | null = null;
    /** The root, and the overlay container for a root inside the page, since overlays render outside it. */
    #targets: readonly HTMLElement[] = [];

    /** The consumer-provided seeds for the active runtime color palette, or `null` when provider defaults are active. */
    public readonly colorPaletteSeeds = this.#activeColorPaletteSeeds.asReadonly();
    /** What was asked for, which is where `"system"` shows. `selection` says what that came to. */
    public readonly preference: Signal<ThemePreference>;
    public readonly profile: Signal<ThemeProfile>;
    /** The theme and variant in effect. It's always `light` or `dark`, whatever was asked for. */
    public readonly selection: Signal<ThemeSelection>;
    public readonly themeName = computed(() => this.#activeSelection().name);
    public readonly themeVariant = computed(() => this.#activeSelection().variant);

    public constructor() {
        const view = this.#document.defaultView;
        this.#colorSchemeQuery = view?.matchMedia?.("(prefers-color-scheme: dark)");
        this.#transparencyQuery = view?.matchMedia?.("(prefers-reduced-transparency: reduce)");
        this.#storage = this.#options.persistKey ? inject(THEME_STORAGE) : null;
        this.#targets = this.#root ? [this.#root] : [];

        const preference = this.#readStoredPreference() ?? normalizePreference(this.#options.initialTheme);
        const selection = this.#resolveSelection(preference);
        this.#activePreference = signal(preference);
        this.#activeSelection = signal(selection);
        this.#activeProfile = signal(this.#strategy.resolve(selection));
        this.preference = this.#activePreference.asReadonly();
        this.profile = this.#activeProfile.asReadonly();
        this.selection = this.#activeSelection.asReadonly();

        this.#claimRoot();
        this.#applyTheme(selection, this.#activeProfile());
        this.#destroyRef.onDestroy(() => this.#releaseRoot());
        if (this.#root && this.#root !== this.#document.documentElement) {
            this.#themeOverlayContainer();
        }
        const transparencyQuery = this.#transparencyQuery;
        if (transparencyQuery) {
            const onPreferenceChange = (): void => this.#applyTheme(this.#activeSelection(), this.#activeProfile());
            transparencyQuery.addEventListener("change", onPreferenceChange);
            this.#destroyRef.onDestroy(() => transparencyQuery.removeEventListener("change", onPreferenceChange));
        }
        const colorSchemeQuery = this.#colorSchemeQuery;
        if (colorSchemeQuery) {
            const onColorSchemeChange = (): void => {
                if (this.#activePreference().variant === "system") {
                    this.#select(this.#activePreference());
                }
            };
            colorSchemeQuery.addEventListener("change", onColorSchemeChange);
            this.#destroyRef.onDestroy(() => colorSchemeQuery.removeEventListener("change", onColorSchemeChange));
        }
    }

    /**
     * The registered themes and the variants each one has. A custom `ThemeStrategy` reports them through its
     * optional `availableThemes()`, and this is empty for one that doesn't.
     */
    public availableThemes(): readonly ThemeAvailability[] {
        return this.#strategy.availableThemes?.() ?? [];
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

    /**
     * Switches the theme, and remembers it if a `persistKey` was given. `"system"` follows the operating system's
     * setting from then on, and takes the variant a theme has when it only has one.
     * @throws if the theme isn't registered, or doesn't have the variant asked for
     */
    public setTheme(preference: ThemePreference): void {
        const normalized = normalizePreference(preference);
        this.#select(normalized);
        this.#activePreference.set(normalized);
        this.#writeStoredPreference(normalized);
    }

    /** Whether `setTheme` would accept this. A saved choice can be checked with it before it's restored. */
    public supportsVariant(name: ThemeName, variant: ThemeVariant): boolean {
        try {
            this.#strategy.resolve({ name, variant });
            return true;
        } catch {
            return false;
        }
    }

    #applyTheme(selection: ThemeSelection, profile: ThemeProfile): void {
        const transparency = this.#getTransparencyMode();
        const variables = getEffectiveVariables(profile, transparency);
        for (const target of this.#targets) {
            for (const previousName of this.#appliedVariables) {
                if (!(previousName in variables)) {
                    target.style.removeProperty(previousName);
                }
            }
            for (const [name, value] of Object.entries(variables)) {
                target.style.setProperty(name, value);
            }

            target.style.setProperty("color-scheme", selection.variant);
            target.setAttribute("data-mona-theme", selection.name);
            target.setAttribute("data-mona-variant", selection.variant);
            target.setAttribute("data-mona-transparency", transparency);
        }
        this.#appliedVariables.clear();
        for (const name of Object.keys(variables)) {
            this.#appliedVariables.add(name as ThemeVariable);
        }
    }

    #claimRoot(): void {
        const root = this.#root;
        if (!root) {
            return;
        }
        if (isDevMode() && themeWriters.has(root)) {
            console.warn(
                "Mona UI: two applications are writing a theme to the same element, so each overwrites the other. Give one of them its own element with provideThemeRoot()."
            );
        }
        themeWriters.set(root, this);
    }

    #getTransparencyMode(): TransparencyMode {
        const css = this.#document.defaultView?.CSS;
        const supportsBackdropFilter =
            css?.supports("backdrop-filter", "blur(1px)") === true ||
            css?.supports("-webkit-backdrop-filter", "blur(1px)") === true;
        return supportsBackdropFilter && this.#transparencyQuery?.matches !== true ? "full" : "reduced";
    }

    /** What's stored, if this service could apply it. Anything else counts as nothing stored, and stays there. */
    #readStoredPreference(): ThemePreference | null {
        const key = this.#options.persistKey;
        if (!key || !this.#storage) {
            return null;
        }
        let stored: ThemePreference | null;
        try {
            stored = this.#storage.read(key);
        } catch (error) {
            this.#reportStorageError(error);
            return null;
        }
        if (!isThemePreference(stored) || !this.#canApply(stored)) {
            return null;
        }
        this.#knownStored = normalizePreference(stored);
        return this.#knownStored;
    }

    #canApply(preference: ThemePreference): boolean {
        return preference.variant === "system"
            ? this.supportsVariant(preference.name, "light") || this.supportsVariant(preference.name, "dark")
            : this.supportsVariant(preference.name, preference.variant);
    }

    #releaseRoot(): void {
        const root = this.#root;
        if (!root || themeWriters.get(root) !== this) {
            return;
        }
        themeWriters.delete(root);
        for (const target of this.#targets) {
            for (const name of this.#appliedVariables) {
                target.style.removeProperty(name);
            }
            target.style.removeProperty("color-scheme");
            target.removeAttribute("data-mona-theme");
            target.removeAttribute("data-mona-variant");
            target.removeAttribute("data-mona-transparency");
        }
        this.#targets = [];
    }

    #reportStorageError(error: unknown): void {
        if (isDevMode()) {
            console.error("Mona UI: the theme storage threw.", error);
        }
    }

    #resolveProfile(selection: ThemeSelection): ThemeProfile {
        const profile = this.#strategy.resolve(selection);
        const palette = this.#runtimeColorPalette;
        return palette ? applyColorPalette(profile, palette[selection.variant]) : profile;
    }

    #resolveSelection(preference: ThemePreference): ThemeSelection {
        if (preference.variant !== "system") {
            return Object.freeze({ name: preference.name, variant: preference.variant });
        }
        const wanted: ThemeVariant = this.#colorSchemeQuery?.matches === true ? "dark" : "light";
        const other: ThemeVariant = wanted === "dark" ? "light" : "dark";
        const onlyOther =
            !this.supportsVariant(preference.name, wanted) && this.supportsVariant(preference.name, other);
        return Object.freeze({ name: preference.name, variant: onlyOther ? other : wanted });
    }

    #select(preference: ThemePreference): void {
        const selection = this.#resolveSelection(preference);
        const profile = this.#resolveProfile(selection);
        this.#applyTheme(selection, profile);
        this.#activeProfile.set(profile);
        this.#activeSelection.set(selection);
    }

    /**
     * Loaded on demand, so an application themed at `<html>` doesn't take on the overlay module for this. An overlay
     * opened before it arrives gets its colors when it does.
     */
    #themeOverlayContainer(): void {
        void import("@angular/cdk/overlay").then(overlay => {
            if (this.#targets.length > 0) {
                this.#targets = [...this.#targets, this.#injector.get(overlay.OverlayContainer).getContainerElement()];
                this.#applyTheme(this.#activeSelection(), this.#activeProfile());
            }
        });
    }

    #writeStoredPreference(preference: ThemePreference): void {
        const key = this.#options.persistKey;
        const known = this.#knownStored;
        if (
            !key ||
            !this.#storage ||
            (known && known.name === preference.name && known.variant === preference.variant)
        ) {
            return;
        }
        this.#knownStored = preference;
        try {
            this.#storage.write(key, preference);
        } catch (error) {
            this.#reportStorageError(error);
        }
    }
}

type TransparencyMode = "full" | "reduced";

const effectLevels: readonly ThemeEffectLevel[] = ["control", "raised", "overlay"];
const preferenceVariants: readonly unknown[] = ["light", "dark", "system"];

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

function isThemePreference(value: unknown): value is ThemePreference {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const { name, variant } = value as Partial<Record<keyof ThemePreference, unknown>>;
    return typeof name === "string" && preferenceVariants.includes(variant);
}

function normalizePreference(preference: ThemePreference): ThemePreference {
    return Object.freeze({ name: preference.name, variant: preference.variant });
}
