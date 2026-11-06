import { computed, Directive, input } from "@angular/core";
import type { StepState } from "../models/Step";
import type { StepperVariantProps } from "../styles/stepper.styles";
import { stepperStepIndicatorThemeVariants } from "../styles/stepper.styles";

@Directive({
    selector: "button[monaStepperIndicator]",
    host: {
        "[class]": "stepIndicatorClass()"
    }
})
export class StepperIndicatorDirective {
    protected readonly stepIndicatorClass = computed(() => {
        const invalid = this.invalid();
        const rounded = this.rounded();
        const state = this.state();
        return stepperStepIndicatorThemeVariants({ invalid, rounded, state });
    });
    public readonly invalid = input.required<boolean>();
    public readonly rounded = input.required<StepperVariantProps["rounded"]>();
    public readonly state = input.required<StepState>();
}
