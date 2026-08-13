import { Directive, inject, TemplateRef } from "@angular/core";
import type { RatingItemTemplateContext } from "../models/RatingItemTemplateContext";

/**
 * @description Renders the default (unselected) visual for every rating item. Overrides the
 * default preset icon for the base layer of each item.
 */
@Directive({
    selector: "ng-template[monaRatingItemTemplate]"
})
export class RatingItemTemplateDirective {
    public readonly templateRef = inject<TemplateRef<RatingItemTemplateContext>>(TemplateRef);

    public static ngTemplateContextGuard(
        _directive: RatingItemTemplateDirective,
        context: unknown
    ): context is RatingItemTemplateContext {
        return true;
    }
}
