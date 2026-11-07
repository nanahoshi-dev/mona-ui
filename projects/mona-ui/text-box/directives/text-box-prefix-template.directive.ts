import { Directive } from "@angular/core";

/**
 * Marks an `<ng-template>` as a prefix slot. The template is rendered inside the container's left side. Multiple prefix
 * templates are supported and render in source order.
 */
@Directive({
    selector: "ng-template[monaTextBoxPrefixTemplate]"
})
export class TextBoxPrefixTemplateDirective {}
