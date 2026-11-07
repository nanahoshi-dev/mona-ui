import { Directive } from "@angular/core";

/**
 * Marks an `<ng-template>` as a suffix slot. The template is rendered inside the container's right side, after the
 * optional clear button. Multiple suffix templates are supported and render in source order.
 */
@Directive({
    selector: "ng-template[monaTextBoxSuffixTemplate]"
})
export class TextBoxSuffixTemplateDirective {}
