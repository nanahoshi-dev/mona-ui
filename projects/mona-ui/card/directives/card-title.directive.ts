import { Directive, inject, TemplateRef } from "@angular/core";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import type { CardTemplateContext } from "../models/CardTemplateContext";

@Directive({
    selector: "ng-template[monaCardTitle]"
})
export class CardTitleDirective {
    public readonly id = createElementControlId();
    public readonly templateRef = inject(TemplateRef);

    public static ngTemplateContextGuard(
        _directive: CardTitleDirective,
        _context: unknown
    ): _context is CardTemplateContext {
        return true;
    }
}
