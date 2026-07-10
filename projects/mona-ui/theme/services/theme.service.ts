import { DOCUMENT, inject, Injectable, InjectionToken, signal } from "@angular/core";
import { themeDefinitions } from "../definitions/theme-definitions";
import type { ThemeId, ThemeStyle, ThemeVariant } from "../models/Theme";
import type { ThemeDefinitionRegistry, ThemeVariables } from "../models/ThemeDefinition";
import { MONA_UI_THEME_CONFIG } from "../providers/theme.providers";
import { toRuntimeVariableName } from "../utils/theme-runtime-css";

export const THEME_DEFINITIONS = new InjectionToken<ThemeDefinitionRegistry>("THEME_DEFINITIONS", {
    providedIn: "root",
    factory: () => themeDefinitions
});

@Injectable({
    providedIn: "root"
})
export class ThemeService {
    readonly #config = inject(MONA_UI_THEME_CONFIG);
    readonly #definitions = inject(THEME_DEFINITIONS);
    readonly #document = inject(DOCUMENT);
    readonly #theme = signal<ThemeStyle>("mona");
    readonly #themeVariant = signal<ThemeVariant>("light");
    readonly #runtimeVariableNames = new Set<string>();
    public readonly theme = this.#theme.asReadonly();
    public readonly themeId = signal<ThemeId>("mona-light");
    public readonly themeVariant = this.#themeVariant.asReadonly();

    public constructor() {
        this.setThemeId(this.#config.defaultThemeId ?? "mona-light");
    }

    public setThemeId(themeId: ThemeId): void {
        const [theme, variant] = themeId.split("-") as [ThemeStyle, ThemeVariant];
        if (!this.#definitions[theme]?.[variant]) {
            throw new Error(`Unknown Mona UI theme: ${themeId}`);
        }

        this.#theme.set(theme);
        this.#themeVariant.set(variant);
        this.themeId.set(themeId);
        this.#updateThemeVariables();
    }

    private getActiveThemeVariables(): ThemeVariables {
        const themeId = this.themeId();
        const [theme, variant] = themeId.split("-") as [ThemeStyle, ThemeVariant];
        const definition = this.#definitions[theme][variant];
        const overrides = this.#config.variableOverrides?.[themeId] ?? {};

        const variables = {
            ...definition,
            ...overrides
        };

        return Object.fromEntries(
            Object.entries(variables).filter(([, value]) => value !== undefined)
        ) as ThemeVariables;
    }

    #updateThemeVariables(): void {
        const root = this.#document.documentElement;
        const themeVariables = this.getActiveThemeVariables();
        const runtimeVariableNames = new Set<string>();

        for (const variableName of this.#runtimeVariableNames) {
            root.style.removeProperty(variableName);
        }

        for (const [variableName, value] of Object.entries(themeVariables)) {
            const runtimeVariableName = toRuntimeVariableName(variableName);
            runtimeVariableNames.add(runtimeVariableName);
            root.style.setProperty(runtimeVariableName, value);
        }

        this.#runtimeVariableNames.clear();
        for (const variableName of runtimeVariableNames) {
            this.#runtimeVariableNames.add(variableName);
        }
    }
}

export type { MonaUiThemeConfig } from "../providers/theme.providers";
export { provideMonaUiTheme } from "../providers/theme.providers";
