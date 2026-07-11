import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createTimePickerStyleStrategy } from "./time-picker.style-strategy";
import type {
    TimePickerStyleOverrides,
    TimePickerStyleStrategy,
    TimePickerStylesProviderConfig
} from "./time-picker.types";

export const TIME_PICKER_STYLE_OVERRIDES = new InjectionToken<readonly TimePickerStyleOverrides[]>(
    "TIME_PICKER_STYLE_OVERRIDES"
);

export const TIME_PICKER_STYLE_STRATEGY = new InjectionToken<TimePickerStyleStrategy>("TIME_PICKER_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createTimePickerStyleStrategy(inject(TIME_PICKER_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideTimePickerStyles(config: TimePickerStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: TIME_PICKER_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: TIME_PICKER_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
