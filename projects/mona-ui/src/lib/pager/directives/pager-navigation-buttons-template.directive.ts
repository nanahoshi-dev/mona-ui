import { Directive, inject, input, TemplateRef } from "@angular/core";
import { NavigationButtonsTemplateContext } from "../models/NavigationButtonsTemplateContext";

@Directive({
    selector: "ng-template[monaPagerNavigationButtonsTemplate]"
})
export class PagerNavigationButtonsTemplateDirective {
    public readonly templateRef = inject<TemplateRef<NavigationButtonsTemplateContext>>(TemplateRef);
    public readonly type = input.required<"first" | "last" | "next" | "previous">();
}
