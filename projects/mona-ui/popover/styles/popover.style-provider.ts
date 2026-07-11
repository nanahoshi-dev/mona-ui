import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createPopoverStyleStrategy } from "./popover.style-strategy";
import type { PopoverStyleOverrides, PopoverStyleStrategy, PopoverStylesProviderConfig } from "./popover.types";

export const POPOVER_STYLE_OVERRIDES = new InjectionToken<readonly PopoverStyleOverrides[]>("POPOVER_STYLE_OVERRIDES");

export const POPOVER_STYLE_STRATEGY = new InjectionToken<PopoverStyleStrategy>("POPOVER_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createPopoverStyleStrategy(inject(POPOVER_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function providePopoverStyles(config: PopoverStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: POPOVER_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: POPOVER_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
