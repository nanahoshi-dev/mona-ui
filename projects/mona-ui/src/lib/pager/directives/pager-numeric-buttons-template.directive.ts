import { Directive, inject, TemplateRef } from "@angular/core";
import type { NumericButtonsTemplateContext } from "mona-ui/pager/models/NumericButtonsTemplateContext";

@Directive({
    selector: "ng-template[monaPagerNumericButtonsTemplate]"
})
export class PagerNumericButtonsTemplateDirective {
    public readonly templateRef = inject<TemplateRef<NumericButtonsTemplateContext>>(TemplateRef);
}
