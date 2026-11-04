import type { PagerContext } from "./PagerContext";

/**
 * Context of `monaPagerNumericButtonsTemplate`. The template renders inside the pager's `<ol>`, so put each
 * control in an `<li>`.
 */
export interface NumericButtonsTemplateContext extends PagerContext {
    readonly $implicit: PagerContext;

    /** The page numbers the default buttons would show, in order (the first and last page included). */
    readonly pages: readonly number[];
}
