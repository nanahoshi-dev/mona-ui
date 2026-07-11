import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createWindowStyleStrategy } from "./window.style-strategy";
import type { WindowStyleOverrides, WindowStyleStrategy, WindowStylesProviderConfig } from "./window.types";

export const WINDOW_STYLE_OVERRIDES = new InjectionToken<readonly WindowStyleOverrides[]>("WINDOW_STYLE_OVERRIDES");

export const WINDOW_STYLE_STRATEGY = new InjectionToken<WindowStyleStrategy>("WINDOW_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createWindowStyleStrategy(inject(WINDOW_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideWindowStyles(config: WindowStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: WINDOW_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: WINDOW_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
