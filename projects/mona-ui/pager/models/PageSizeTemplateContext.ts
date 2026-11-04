import type { PagerContext } from "./PagerContext";

export interface PageSizeTemplateContext extends PagerContext {
    /** The page sizes offered, as for the default dropdown. */
    readonly $implicit: readonly number[];
}
