import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createFieldsetStyleStrategy } from "./fieldset.style-strategy";
import type { FieldsetStyleOverrides, FieldsetStyleStrategy, FieldsetStylesProviderConfig } from "./fieldset.types";

export const FIELDSET_STYLE_OVERRIDES = new InjectionToken<readonly FieldsetStyleOverrides[]>(
    "FIELDSET_STYLE_OVERRIDES"
);

export const FIELDSET_STYLE_STRATEGY = new InjectionToken<FieldsetStyleStrategy>("FIELDSET_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createFieldsetStyleStrategy(inject(FIELDSET_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideFieldsetStyles(config: FieldsetStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: FIELDSET_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: FIELDSET_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
