import type { PagerContext } from "./PagerContext";

export interface InfoTemplateContext extends PagerContext {
    /** The pager state, the same values the context spreads at its top level. */
    readonly $implicit: PagerContext;
}
