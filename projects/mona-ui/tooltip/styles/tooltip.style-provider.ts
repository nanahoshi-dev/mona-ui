import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createTooltipStyleStrategy } from "./tooltip.style-strategy";
import type { TooltipStyleOverrides, TooltipStyleStrategy, TooltipStylesProviderConfig } from "./tooltip.types";

export const TOOLTIP_STYLE_OVERRIDES = new InjectionToken<readonly TooltipStyleOverrides[]>("TOOLTIP_STYLE_OVERRIDES");

export const TOOLTIP_STYLE_STRATEGY = new InjectionToken<TooltipStyleStrategy>("TOOLTIP_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createTooltipStyleStrategy(inject(TOOLTIP_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideTooltipStyles(config: TooltipStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: TOOLTIP_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: TOOLTIP_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
