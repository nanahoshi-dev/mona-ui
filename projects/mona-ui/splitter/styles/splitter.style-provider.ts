import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createSplitterStyleStrategy } from "./splitter.style-strategy";
import type { SplitterStyleOverrides, SplitterStyleStrategy, SplitterStylesProviderConfig } from "./splitter.types";

export const SPLITTER_STYLE_OVERRIDES = new InjectionToken<readonly SplitterStyleOverrides[]>(
    "SPLITTER_STYLE_OVERRIDES"
);

export const SPLITTER_STYLE_STRATEGY = new InjectionToken<SplitterStyleStrategy>("SPLITTER_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createSplitterStyleStrategy(inject(SPLITTER_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideSplitterStyles(config: SplitterStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: SPLITTER_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: SPLITTER_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
