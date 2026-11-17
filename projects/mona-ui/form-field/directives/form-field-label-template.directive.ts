import { Directive } from "@angular/core";

/**
 * Replaces the `label` text with projected content. Its text names the control, so keep interactive elements out of
 * it. The template has no context variables.
 */
@Directive({
    selector: "ng-template[monaFormFieldLabelTemplate]"
})
export class FormFieldLabelTemplateDirective {}
