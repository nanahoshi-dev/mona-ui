import { Directive } from "@angular/core";

/**
 * Marks an ng-template as the custom label template for mona-stepper.
 * The template context provides the step options, index, active state, and current step index.
 */
@Directive({
    selector: "ng-template[monaStepperLabelTemplate]"
})
export class StepperLabelTemplateDirective {}
