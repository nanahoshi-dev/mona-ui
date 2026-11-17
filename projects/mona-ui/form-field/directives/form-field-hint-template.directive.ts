import { Directive } from "@angular/core";

/**
 * Replaces the `hint` text with projected content, such as text with a link. It still describes the control. The
 * template has no context variables.
 */
@Directive({
    selector: "ng-template[monaFormFieldHintTemplate]"
})
export class FormFieldHintTemplateDirective {}
