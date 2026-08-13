import { Directive, inject, TemplateRef } from "@angular/core";
import type { RatingItemTemplateContext } from "../models/RatingItemTemplateContext";

/**
 * @description Renders the pointer-preview visual for rating items. Overrides the default preset
 * overlay whenever the visible state comes from pointer preview.
 */
@Directive({
    selector: "ng-template[monaRatingHoveredItemTemplate]"
})
export class RatingHoveredItemTemplateDirective {
    public readonly templateRef = inject<TemplateRef<RatingItemTemplateContext>>(TemplateRef);

    public static ngTemplateContextGuard(
        _directive: RatingHoveredItemTemplateDirective,
        context: unknown
    ): context is RatingItemTemplateContext {
        return true;
    }
}
