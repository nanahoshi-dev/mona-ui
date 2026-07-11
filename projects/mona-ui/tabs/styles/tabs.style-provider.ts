import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createTabsStyleStrategy } from "./tabs.style-strategy";
import type { TabsStyleOverrides, TabsStylesProviderConfig, TabsStyleStrategy } from "./tabs.types";

export const TABS_STYLE_OVERRIDES = new InjectionToken<readonly TabsStyleOverrides[]>("TABS_STYLE_OVERRIDES");

export const TABS_STYLE_STRATEGY = new InjectionToken<TabsStyleStrategy>("TABS_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createTabsStyleStrategy(inject(TABS_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideTabsStyles(config: TabsStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: TABS_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: TABS_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
