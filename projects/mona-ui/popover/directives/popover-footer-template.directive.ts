import { Directive } from "@angular/core";

/** Marks an `ng-template` as the popover's custom footer content. */
@Directive({
    selector: "ng-template[monaPopoverFooterTemplate]"
})
export class PopoverFooterTemplateDirective {}
