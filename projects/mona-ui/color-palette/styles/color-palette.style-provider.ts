import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createColorPaletteStyleStrategy } from "./color-palette.style-strategy";
import type {
    ColorPaletteStyleOverrides,
    ColorPaletteStyleStrategy,
    ColorPaletteStylesProviderConfig
} from "./color-palette.types";

export const COLOR_PALETTE_STYLE_OVERRIDES = new InjectionToken<readonly ColorPaletteStyleOverrides[]>(
    "COLOR_PALETTE_STYLE_OVERRIDES"
);

export const COLOR_PALETTE_STYLE_STRATEGY = new InjectionToken<ColorPaletteStyleStrategy>(
    "COLOR_PALETTE_STYLE_STRATEGY",
    {
        providedIn: "root",
        factory: () => createColorPaletteStyleStrategy(inject(COLOR_PALETTE_STYLE_OVERRIDES, { optional: true }) ?? [])
    }
);

export function provideColorPaletteStyles(config: ColorPaletteStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: COLOR_PALETTE_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: COLOR_PALETTE_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
