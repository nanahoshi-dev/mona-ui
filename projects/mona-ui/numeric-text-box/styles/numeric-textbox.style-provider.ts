import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createNumericTextboxStyleStrategy } from "./numeric-textbox.style-strategy";
import type {
    NumericTextboxStyleOverrides,
    NumericTextboxStyleStrategy,
    NumericTextboxStylesProviderConfig
} from "./numeric-textbox.types";

export const NUMERIC_TEXT_BOX_STYLE_OVERRIDES = new InjectionToken<readonly NumericTextboxStyleOverrides[]>(
    "NUMERIC_TEXT_BOX_STYLE_OVERRIDES"
);

export const NUMERIC_TEXT_BOX_STYLE_STRATEGY = new InjectionToken<NumericTextboxStyleStrategy>(
    "NUMERIC_TEXT_BOX_STYLE_STRATEGY",
    {
        providedIn: "root",
        factory: () =>
            createNumericTextboxStyleStrategy(inject(NUMERIC_TEXT_BOX_STYLE_OVERRIDES, { optional: true }) ?? [])
    }
);

export function provideNumericTextBoxStyles(config: NumericTextboxStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: NUMERIC_TEXT_BOX_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: NUMERIC_TEXT_BOX_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
