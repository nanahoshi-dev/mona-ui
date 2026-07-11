import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createMenubarStyleStrategy } from "./menu.style-strategy";
import type { MenubarStyleOverrides, MenubarStylesProviderConfig, MenubarStyleStrategy } from "./menu.types";

export const MENUBAR_STYLE_OVERRIDES = new InjectionToken<readonly MenubarStyleOverrides[]>(
    "MENUBAR_STYLE_OVERRIDES"
);

export const MENUBAR_STYLE_STRATEGY = new InjectionToken<MenubarStyleStrategy>("MENUBAR_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createMenubarStyleStrategy(inject(MENUBAR_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideMenubarStyles(config: MenubarStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: MENUBAR_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: MENUBAR_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
