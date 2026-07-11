import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createListViewStyleStrategy } from "./list-view.style-strategy";
import type { ListViewStyleOverrides, ListViewStylesProviderConfig, ListViewStyleStrategy } from "./list-view.types";

export const LIST_VIEW_STYLE_OVERRIDES = new InjectionToken<readonly ListViewStyleOverrides[]>(
    "LIST_VIEW_STYLE_OVERRIDES"
);

export const LIST_VIEW_STYLE_STRATEGY = new InjectionToken<ListViewStyleStrategy>("LIST_VIEW_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createListViewStyleStrategy(inject(LIST_VIEW_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideListViewStyles(config: ListViewStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: LIST_VIEW_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: LIST_VIEW_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
