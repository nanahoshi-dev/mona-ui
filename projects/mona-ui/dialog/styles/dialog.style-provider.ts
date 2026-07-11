import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createDialogStyleStrategy } from "./dialog.style-strategy";
import type { DialogStyleOverrides, DialogStyleStrategy, DialogStylesProviderConfig } from "./dialog.types";

export const DIALOG_STYLE_OVERRIDES = new InjectionToken<readonly DialogStyleOverrides[]>("DIALOG_STYLE_OVERRIDES");

export const DIALOG_STYLE_STRATEGY = new InjectionToken<DialogStyleStrategy>("DIALOG_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createDialogStyleStrategy(inject(DIALOG_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideDialogStyles(config: DialogStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: DIALOG_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: DIALOG_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
