import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createComboBoxStyleStrategy } from "./combo-box.style-strategy";
import type { ComboBoxStyleOverrides, ComboBoxStyleStrategy, ComboBoxStylesProviderConfig } from "./combo-box.types";

export const COMBO_BOX_STYLE_OVERRIDES = new InjectionToken<readonly ComboBoxStyleOverrides[]>(
    "COMBO_BOX_STYLE_OVERRIDES"
);

export const COMBO_BOX_STYLE_STRATEGY = new InjectionToken<ComboBoxStyleStrategy>("COMBO_BOX_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createComboBoxStyleStrategy(inject(COMBO_BOX_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideComboBoxStyles(config: ComboBoxStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: COMBO_BOX_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: COMBO_BOX_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
