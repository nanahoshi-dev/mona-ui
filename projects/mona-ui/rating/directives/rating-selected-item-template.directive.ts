import { Directive, inject, TemplateRef } from "@angular/core";
import type { RatingItemTemplateContext } from "../models/RatingItemTemplateContext";

/**
 * @description Renders the committed selected visual for rating items. Overrides the default
 * preset overlay whenever the visible state comes from the committed value.
 */
@Directive({
    selector: "ng-template[monaRatingSelectedItemTemplate]"
})
export class RatingSelectedItemTemplateDirective {
    public readonly templateRef = inject<TemplateRef<RatingItemTemplateContext>>(TemplateRef);

    public static ngTemplateContextGuard(
        _directive: RatingSelectedItemTemplateDirective,
        context: unknown
    ): context is RatingItemTemplateContext {
        return true;
    }
}
