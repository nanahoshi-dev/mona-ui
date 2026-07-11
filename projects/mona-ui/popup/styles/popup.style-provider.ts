import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createPopupStyleStrategy } from "./popup.style-strategy";
import type { PopupAnimationStrategy, PopupStyleOverrides, PopupStylesProviderConfig } from "./popup.types";

export const POPUP_STYLE_OVERRIDES = new InjectionToken<readonly PopupStyleOverrides[]>("POPUP_STYLE_OVERRIDES");

export const POPUP_STYLE_STRATEGY = new InjectionToken<PopupAnimationStrategy>("POPUP_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createPopupStyleStrategy(inject(POPUP_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function providePopupStyles(config: PopupStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: POPUP_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: POPUP_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
