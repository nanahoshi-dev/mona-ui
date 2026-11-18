import { Directive } from "@angular/core";

/**
 * Marks an `<ng-template>` as content before the masked text box's input, such as an icon or a country code. Several
 * render in source order.
 */
@Directive({
    selector: "ng-template[monaMaskedTextBoxPrefixTemplate]"
})
export class MaskedTextBoxPrefixTemplateDirective {}
