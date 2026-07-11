import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createDateTimePickerStyleStrategy } from "./datetime-picker.style-strategy";
import type {
    DateTimePickerStyleOverrides,
    DateTimePickerStyleStrategy,
    DateTimePickerStylesProviderConfig
} from "./datetime-picker.types";

export const DATETIME_PICKER_STYLE_OVERRIDES = new InjectionToken<readonly DateTimePickerStyleOverrides[]>(
    "DATETIME_PICKER_STYLE_OVERRIDES"
);

export const DATETIME_PICKER_STYLE_STRATEGY = new InjectionToken<DateTimePickerStyleStrategy>(
    "DATETIME_PICKER_STYLE_STRATEGY",
    {
        providedIn: "root",
        factory: () =>
            createDateTimePickerStyleStrategy(inject(DATETIME_PICKER_STYLE_OVERRIDES, { optional: true }) ?? [])
    }
);

export function provideDateTimePickerStyles(config: DateTimePickerStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: DATETIME_PICKER_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: DATETIME_PICKER_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
