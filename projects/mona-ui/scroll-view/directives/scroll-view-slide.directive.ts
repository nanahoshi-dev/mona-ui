import { Directive, inject, input, TemplateRef } from "@angular/core";
import type { ScrollViewSlideContext } from "../models/ScrollViewSlideContext";

/**
 * @description Marks the template that renders each slide. Bind `[monaScrollViewSlide]` to the same data as the scroll
 * view, and `let-item` takes its type from it.
 */
@Directive({
    selector: "ng-template[monaScrollViewSlide]"
})
export class ScrollViewSlideDirective<T = unknown> {
    /**
     * @description The scroll view's data, bound only so that `let-item` takes its type from it. Leave it empty for
     * `unknown`.
     * @default ""
     */
    public readonly monaScrollViewSlide = input<Iterable<T> | "">("");
    public readonly templateRef = inject<TemplateRef<ScrollViewSlideContext<T>>>(TemplateRef);

    public static ngTemplateContextGuard<T>(
        _dir: ScrollViewSlideDirective<T>,
        _ctx: unknown
    ): _ctx is ScrollViewSlideContext<T> {
        return true;
    }
}
