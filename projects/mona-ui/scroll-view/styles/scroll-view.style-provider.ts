import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createScrollViewStyleStrategy } from "./scroll-view.style-strategy";
import type {
    ScrollViewStyleOverrides,
    ScrollViewStyleStrategy,
    ScrollViewStylesProviderConfig
} from "./scroll-view.types";

export const SCROLL_VIEW_STYLE_OVERRIDES = new InjectionToken<readonly ScrollViewStyleOverrides[]>(
    "SCROLL_VIEW_STYLE_OVERRIDES"
);

export const SCROLL_VIEW_STYLE_STRATEGY = new InjectionToken<ScrollViewStyleStrategy>("SCROLL_VIEW_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createScrollViewStyleStrategy(inject(SCROLL_VIEW_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideScrollViewStyles(config: ScrollViewStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: SCROLL_VIEW_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: SCROLL_VIEW_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
