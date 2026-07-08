import { Directive } from "@angular/core";

@Directive({
    selector: "[monaPagerFocusable]",
    host: {
        "[attr.data-mona-pager-focusable]": "'true'"
    }
})
export class PagerFocusableDirective {}
