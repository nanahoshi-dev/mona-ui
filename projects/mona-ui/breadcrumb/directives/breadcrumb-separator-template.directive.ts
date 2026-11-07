import { Directive } from "@angular/core";

/**
 * Apply to an `<ng-template>` directly inside `<mona-breadcrumb>` to replace the default `ChevronRight` separator. One
 * directive per breadcrumb — the first match is used.
 */
@Directive({
    selector: "ng-template[monaBreadcrumbSeparatorTemplate]"
})
export class BreadcrumbSeparatorTemplateDirective {}
