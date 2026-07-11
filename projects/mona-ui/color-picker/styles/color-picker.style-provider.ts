import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createColorPickerStyleStrategy } from "./color-picker.style-strategy";
import type {
    ColorPickerStyleOverrides,
    ColorPickerStyleStrategy,
    ColorPickerStylesProviderConfig
} from "./color-picker.types";

export const COLOR_PICKER_STYLE_OVERRIDES = new InjectionToken<readonly ColorPickerStyleOverrides[]>(
    "COLOR_PICKER_STYLE_OVERRIDES"
);

export const COLOR_PICKER_STYLE_STRATEGY = new InjectionToken<ColorPickerStyleStrategy>(
    "COLOR_PICKER_STYLE_STRATEGY",
    {
        providedIn: "root",
        factory: () => createColorPickerStyleStrategy(inject(COLOR_PICKER_STYLE_OVERRIDES, { optional: true }) ?? [])
    }
);

export function provideColorPickerStyles(config: ColorPickerStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: COLOR_PICKER_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: COLOR_PICKER_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
