import { Directive, inject, input, TemplateRef } from "@angular/core";
import type { NavigationButtonsTemplateContext } from "mona-ui/pager/models/NavigationButtonsTemplateContext";

@Directive({
    selector: "ng-template[monaPagerNavigationButtonsTemplate]"
})
export class PagerNavigationButtonsTemplateDirective {
    public readonly templateRef = inject<TemplateRef<NavigationButtonsTemplateContext>>(TemplateRef);
    public readonly type = input.required<"first" | "last" | "next" | "previous">();
}
