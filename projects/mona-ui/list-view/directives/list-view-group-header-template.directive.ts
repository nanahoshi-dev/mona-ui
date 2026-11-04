import { Directive } from "@angular/core";

/**
 * Template for the header of each group. The group's value is the template's implicit value (`let-group`); see
 * `ListViewGroupHeaderTemplateContext`. The context isn't type-checked, so templates written against the value's own
 * type keep compiling.
 */
@Directive({
    selector: "ng-template[monaListViewGroupHeaderTemplate]"
})
export class ListViewGroupHeaderTemplateDirective {}
