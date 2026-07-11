import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createPagerStyleStrategy } from "./pager.style-strategy";
import type { PagerStyleOverrides, PagerStylesProviderConfig, PagerStyleStrategy } from "./pager.types";

export const PAGER_STYLE_OVERRIDES = new InjectionToken<readonly PagerStyleOverrides[]>("PAGER_STYLE_OVERRIDES");

export const PAGER_STYLE_STRATEGY = new InjectionToken<PagerStyleStrategy>("PAGER_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createPagerStyleStrategy(inject(PAGER_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function providePagerStyles(config: PagerStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: PAGER_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: PAGER_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
