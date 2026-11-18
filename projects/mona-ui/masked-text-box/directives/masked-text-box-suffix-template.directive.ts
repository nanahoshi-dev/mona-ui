import { Directive } from "@angular/core";

/**
 * Marks an `<ng-template>` as content after the masked text box's input and its clear button, such as a unit or a
 * button. Several render in source order.
 */
@Directive({
    selector: "ng-template[monaMaskedTextBoxSuffixTemplate]"
})
export class MaskedTextBoxSuffixTemplateDirective {}
