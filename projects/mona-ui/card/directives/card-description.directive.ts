import { Directive, inject, TemplateRef } from "@angular/core";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import type { CardTemplateContext } from "../models/CardTemplateContext";

@Directive({
    selector: "ng-template[monaCardDescription]"
})
export class CardDescriptionDirective {
    public readonly id = createElementControlId();
    public readonly templateRef = inject(TemplateRef);

    public static ngTemplateContextGuard(
        _directive: CardDescriptionDirective,
        _context: unknown
    ): _context is CardTemplateContext {
        return true;
    }
}
