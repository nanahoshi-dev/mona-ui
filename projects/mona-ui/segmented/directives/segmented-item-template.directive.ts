import { Directive, inject, input, TemplateRef } from "@angular/core";
import type { SegmentedItemTemplateContext } from "../models/SegmentedItemTemplateContext";
import type { SegmentedOption } from "../models/SegmentedOption";
import type { SegmentedValue } from "../models/SegmentedValue";

/**
 * @description Renders the visual content of every segmented option. Overrides the default label
 * text of each option. Bind the options, as `[monaSegmentedItemTemplate]="options"`, to type `let-option` from them.
 */
@Directive({
    selector: "ng-template[monaSegmentedItemTemplate]"
})
export class SegmentedItemTemplateDirective<T extends SegmentedValue = SegmentedValue> {
    /** @description The options, to type `let-option` from them. It changes nothing else. */
    public readonly options = input<readonly SegmentedOption<T>[] | "" | undefined>(undefined, {
        alias: "monaSegmentedItemTemplate"
    });
    public readonly templateRef = inject<TemplateRef<SegmentedItemTemplateContext<T>>>(TemplateRef);

    public static ngTemplateContextGuard<T extends SegmentedValue>(
        _directive: SegmentedItemTemplateDirective<T>,
        _context: unknown
    ): _context is SegmentedItemTemplateContext<T> {
        return true;
    }
}
