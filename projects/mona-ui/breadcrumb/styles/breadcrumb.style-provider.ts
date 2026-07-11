import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createBreadcrumbStyleStrategy } from "./breadcrumb.style-strategy";
import type { BreadcrumbStyleOverrides, BreadcrumbStyleStrategy, BreadcrumbStylesProviderConfig } from "./breadcrumb.types";

export const BREADCRUMB_STYLE_OVERRIDES = new InjectionToken<readonly BreadcrumbStyleOverrides[]>(
    "BREADCRUMB_STYLE_OVERRIDES"
);

export const BREADCRUMB_STYLE_STRATEGY = new InjectionToken<BreadcrumbStyleStrategy>("BREADCRUMB_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createBreadcrumbStyleStrategy(inject(BREADCRUMB_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideBreadcrumbStyles(config: BreadcrumbStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: BREADCRUMB_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: BREADCRUMB_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
