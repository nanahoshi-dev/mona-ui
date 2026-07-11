import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createPlaceholderStyleStrategy } from "./placeholder.style-strategy";
import type {
    PlaceholderStyleOverrides,
    PlaceholderStyleStrategy,
    PlaceholderStylesProviderConfig
} from "./placeholder.types";

export const PLACEHOLDER_STYLE_OVERRIDES = new InjectionToken<readonly PlaceholderStyleOverrides[]>(
    "PLACEHOLDER_STYLE_OVERRIDES"
);

export const PLACEHOLDER_STYLE_STRATEGY = new InjectionToken<PlaceholderStyleStrategy>("PLACEHOLDER_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createPlaceholderStyleStrategy(inject(PLACEHOLDER_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function providePlaceholderStyles(config: PlaceholderStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: PLACEHOLDER_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: PLACEHOLDER_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
