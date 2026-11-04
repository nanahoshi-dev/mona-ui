import { Directive, inject, TemplateRef } from "@angular/core";
import type { NumericButtonsTemplateContext } from "../models/NumericButtonsTemplateContext";

@Directive({
    selector: "ng-template[monaPagerNumericButtonsTemplate]"
})
export class PagerNumericButtonsTemplateDirective {
    public readonly templateRef = inject<TemplateRef<NumericButtonsTemplateContext>>(TemplateRef);

    public static ngTemplateContextGuard(
        _directive: PagerNumericButtonsTemplateDirective,
        _context: unknown
    ): _context is NumericButtonsTemplateContext {
        return true;
    }
}
