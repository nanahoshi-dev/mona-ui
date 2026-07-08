import { Directive } from "@angular/core";

/**
 * Marks an ng-template as the custom indicator template for mona-stepper.
 * The template context provides the step options, index, active state, and current step index.
 */
@Directive({
    selector: "ng-template[monaStepperIndicatorTemplate]"
})
export class StepperIndicatorTemplateDirective {}
