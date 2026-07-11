import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createEditorStyleStrategy } from "./editor.style-strategy";
import type { EditorStyleOverrides, EditorStylesProviderConfig, EditorStyleStrategy } from "./editor.types";

export const EDITOR_STYLE_OVERRIDES = new InjectionToken<readonly EditorStyleOverrides[]>("EDITOR_STYLE_OVERRIDES");

export const EDITOR_STYLE_STRATEGY = new InjectionToken<EditorStyleStrategy>("EDITOR_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createEditorStyleStrategy(inject(EDITOR_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideEditorStyles(config: EditorStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: EDITOR_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: EDITOR_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
