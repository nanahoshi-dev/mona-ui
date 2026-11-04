import { Directive, inject, TemplateRef } from "@angular/core";
import type { InfoTemplateContext } from "../models/InfoTemplateContext";

@Directive({
    selector: "ng-template[monaPagerInfoTemplate]"
})
export class PagerInfoTemplateDirective {
    public readonly templateRef = inject<TemplateRef<InfoTemplateContext>>(TemplateRef);

    public static ngTemplateContextGuard(
        _directive: PagerInfoTemplateDirective,
        _context: unknown
    ): _context is InfoTemplateContext {
        return true;
    }
}
