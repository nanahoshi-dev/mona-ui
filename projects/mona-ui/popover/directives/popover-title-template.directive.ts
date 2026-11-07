import { Directive } from "@angular/core";

/** Marks an `ng-template` as the popover's custom title content. */
@Directive({
    selector: "ng-template[monaPopoverTitleTemplate]"
})
export class PopoverTitleTemplateDirective {}
