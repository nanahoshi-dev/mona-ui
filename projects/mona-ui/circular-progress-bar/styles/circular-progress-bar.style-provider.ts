import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createCircularProgressBarStyleStrategy } from "./circular-progress-bar.style-strategy";
import type {
    CircularProgressBarStyleOverrides,
    CircularProgressBarStyleStrategy,
    CircularProgressBarStylesProviderConfig
} from "./circular-progress-bar.types";

export const CIRCULAR_PROGRESS_BAR_STYLE_OVERRIDES = new InjectionToken<readonly CircularProgressBarStyleOverrides[]>(
    "CIRCULAR_PROGRESS_BAR_STYLE_OVERRIDES"
);

export const CIRCULAR_PROGRESS_BAR_STYLE_STRATEGY = new InjectionToken<CircularProgressBarStyleStrategy>(
    "CIRCULAR_PROGRESS_BAR_STYLE_STRATEGY",
    {
        providedIn: "root",
        factory: () =>
            createCircularProgressBarStyleStrategy(
                inject(CIRCULAR_PROGRESS_BAR_STYLE_OVERRIDES, { optional: true }) ?? []
            )
    }
);

export function provideCircularProgressBarStyles(
    config: CircularProgressBarStylesProviderConfig
): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: CIRCULAR_PROGRESS_BAR_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([
        { provide: CIRCULAR_PROGRESS_BAR_STYLE_OVERRIDES, useValue: config, multi: true }
    ]);
}
