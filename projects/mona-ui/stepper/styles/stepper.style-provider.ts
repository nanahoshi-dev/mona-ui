import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createStepperStyleStrategy } from "./stepper.style-strategy";
import type { StepperStyleOverrides, StepperStyleStrategy, StepperStylesProviderConfig } from "./stepper.types";

export const STEPPER_STYLE_OVERRIDES = new InjectionToken<readonly StepperStyleOverrides[]>(
    "STEPPER_STYLE_OVERRIDES"
);

export const STEPPER_STYLE_STRATEGY = new InjectionToken<StepperStyleStrategy>("STEPPER_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createStepperStyleStrategy(inject(STEPPER_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideStepperStyles(config: StepperStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: STEPPER_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: STEPPER_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
