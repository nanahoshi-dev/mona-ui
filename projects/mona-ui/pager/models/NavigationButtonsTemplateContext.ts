import type { PagerContext } from "./PagerContext";

export interface NavigationButtonsTemplateContext extends PagerContext {
    /** The pager state, the same values the context spreads at its top level. */
    readonly $implicit: PagerContext;

    /** True when the button has nowhere to go (the first or last page is current, or there are no pages). */
    readonly disabled: boolean;

    /** Goes to {@link targetPage}. */
    navigate(): void;

    /** The page the button goes to. */
    readonly targetPage: number;
}
