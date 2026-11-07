import { Directive } from "@angular/core";

/**
 * Replaces the string `legend` with projected content inside the `<legend>` element. When this template is present, no
 * default legend styling is applied — the consumer is responsible for all visual treatment. The template has no context
 * variables.
 */
@Directive({
    selector: "ng-template[monaFieldsetLegendTemplate]"
})
export class FieldsetLegendTemplateDirective {}
