import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createProgressBarStyleStrategy } from "./progress-bar.style-strategy";
import type {
    ProgressBarStyleOverrides,
    ProgressBarStyleStrategy,
    ProgressBarStylesProviderConfig
} from "./progress-bar.types";

export const PROGRESS_BAR_STYLE_OVERRIDES = new InjectionToken<readonly ProgressBarStyleOverrides[]>(
    "PROGRESS_BAR_STYLE_OVERRIDES"
);

export const PROGRESS_BAR_STYLE_STRATEGY = new InjectionToken<ProgressBarStyleStrategy>("PROGRESS_BAR_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createProgressBarStyleStrategy(inject(PROGRESS_BAR_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideProgressBarStyles(config: ProgressBarStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: PROGRESS_BAR_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: PROGRESS_BAR_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
