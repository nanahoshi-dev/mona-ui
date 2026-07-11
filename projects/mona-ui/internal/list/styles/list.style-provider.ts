import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createListStyleStrategy } from "./list.style-strategy";
import type { ListStylesOverrides, ListStylesProviderConfig, ListStyleStrategy } from "./list.types";

export const LIST_STYLE_OVERRIDES = new InjectionToken<readonly ListStylesOverrides[]>("LIST_STYLE_OVERRIDES");

export const LIST_STYLE_STRATEGY = new InjectionToken<ListStyleStrategy>("LIST_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createListStyleStrategy(inject(LIST_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideListStyles(config: ListStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: LIST_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: LIST_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
