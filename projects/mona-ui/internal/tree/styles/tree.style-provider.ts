import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createTreeStyleStrategy } from "./tree.style-strategy";
import type { TreeStyleOverrides, TreeStyleStrategy, TreeStylesProviderConfig } from "./tree.types";

export const TREE_STYLE_OVERRIDES = new InjectionToken<readonly TreeStyleOverrides[]>("TREE_STYLE_OVERRIDES");

export const TREE_STYLE_STRATEGY = new InjectionToken<TreeStyleStrategy>("TREE_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createTreeStyleStrategy(inject(TREE_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideTreeStyles(config: TreeStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: TREE_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: TREE_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
