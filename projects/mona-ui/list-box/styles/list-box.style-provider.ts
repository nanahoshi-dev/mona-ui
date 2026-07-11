import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createListBoxStyleStrategy } from "./list-box.style-strategy";
import type { ListBoxStyleOverrides, ListBoxStylesProviderConfig, ListBoxStyleStrategy } from "./list-box.types";

export const LIST_BOX_STYLE_OVERRIDES = new InjectionToken<readonly ListBoxStyleOverrides[]>(
    "LIST_BOX_STYLE_OVERRIDES"
);

export const LIST_BOX_STYLE_STRATEGY = new InjectionToken<ListBoxStyleStrategy>("LIST_BOX_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createListBoxStyleStrategy(inject(LIST_BOX_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideListBoxStyles(config: ListBoxStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: LIST_BOX_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: LIST_BOX_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
