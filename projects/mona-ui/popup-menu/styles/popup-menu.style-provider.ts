import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createPopupMenuStyleStrategy } from "./popup-menu.style-strategy";
import type { PopupMenuStyleOverrides, PopupMenuStyleStrategy, PopupMenuStylesProviderConfig } from "./popup-menu.types";

export const POPUP_MENU_STYLE_OVERRIDES = new InjectionToken<readonly PopupMenuStyleOverrides[]>(
    "POPUP_MENU_STYLE_OVERRIDES"
);

export const POPUP_MENU_STYLE_STRATEGY = new InjectionToken<PopupMenuStyleStrategy>("POPUP_MENU_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createPopupMenuStyleStrategy(inject(POPUP_MENU_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function providePopupMenuStyles(config: PopupMenuStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: POPUP_MENU_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: POPUP_MENU_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
