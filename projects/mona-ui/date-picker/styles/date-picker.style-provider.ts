import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createDatePickerStyleStrategy } from "./date-picker.style-strategy";
import type {
    DatePickerStyleOverrides,
    DatePickerStyleStrategy,
    DatePickerStylesProviderConfig
} from "./date-picker.types";

export const DATE_PICKER_STYLE_OVERRIDES = new InjectionToken<readonly DatePickerStyleOverrides[]>(
    "DATE_PICKER_STYLE_OVERRIDES"
);

export const DATE_PICKER_STYLE_STRATEGY = new InjectionToken<DatePickerStyleStrategy>("DATE_PICKER_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createDatePickerStyleStrategy(inject(DATE_PICKER_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideDatePickerStyles(config: DatePickerStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: DATE_PICKER_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: DATE_PICKER_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
