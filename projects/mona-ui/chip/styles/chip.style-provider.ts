import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createChipStyleStrategy } from "./chip.style-strategy";
import type { ChipStyleOverrides, ChipStyleStrategy, ChipStylesProviderConfig } from "./chip.types";

export const CHIP_STYLE_OVERRIDES = new InjectionToken<readonly ChipStyleOverrides[]>("CHIP_STYLE_OVERRIDES");

export const CHIP_STYLE_STRATEGY = new InjectionToken<ChipStyleStrategy>("CHIP_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createChipStyleStrategy(inject(CHIP_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideChipStyles(config: ChipStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: CHIP_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: CHIP_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
