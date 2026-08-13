import { Directive, inject, TemplateRef } from "@angular/core";
import type { SegmentedItemTemplateContext } from "../models/SegmentedItemTemplateContext";

/**
 * @description Renders the visual content of every segmented option. Overrides the default label
 * text of each option.
 */
@Directive({
    selector: "ng-template[monaSegmentedItemTemplate]"
})
export class SegmentedItemTemplateDirective {
    public readonly templateRef = inject<TemplateRef<SegmentedItemTemplateContext>>(TemplateRef);

    public static ngTemplateContextGuard(
        _directive: SegmentedItemTemplateDirective,
        context: unknown
    ): context is SegmentedItemTemplateContext {
        return true;
    }
}
