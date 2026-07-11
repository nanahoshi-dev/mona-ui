import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createDropdownListStyleStrategy } from "./dropdown-list.style-strategy";
import type {
    DropdownListStyleOverrides,
    DropdownListStyleStrategy,
    DropdownListStylesProviderConfig
} from "./dropdown-list.types";

export const DROPDOWN_LIST_STYLE_OVERRIDES = new InjectionToken<readonly DropdownListStyleOverrides[]>(
    "DROPDOWN_LIST_STYLE_OVERRIDES"
);

export const DROPDOWN_LIST_STYLE_STRATEGY = new InjectionToken<DropdownListStyleStrategy>(
    "DROPDOWN_LIST_STYLE_STRATEGY",
    {
        providedIn: "root",
        factory: () => createDropdownListStyleStrategy(inject(DROPDOWN_LIST_STYLE_OVERRIDES, { optional: true }) ?? [])
    }
);

export function provideDropdownListStyles(config: DropdownListStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: DROPDOWN_LIST_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: DROPDOWN_LIST_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
