import { Directive } from "@angular/core";

/** Renders the selected item in the field. Its context's `$implicit` is the item, or `null` with nothing selected. */
@Directive({
    selector: "ng-template[monaDropDownTreeValueTemplate]"
})
export class DropdownTreeValueTemplateDirective {}
