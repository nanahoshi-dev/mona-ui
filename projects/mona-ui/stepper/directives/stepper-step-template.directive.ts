import { Directive } from "@angular/core";

/**
 * Marks an ng-template as the custom step template for mona-stepper.
 * When provided, this template replaces the entire default step indicator and label for each step.
 * The template context provides the step options, index, active state, and current step index.
 */
@Directive({
    selector: "ng-template[monaStepperStepTemplate]"
})
export class StepperStepTemplateDirective {}
