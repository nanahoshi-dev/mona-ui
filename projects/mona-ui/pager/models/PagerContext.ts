/**
 * The pager's state and actions, passed to every custom template.
 */
export interface PagerContext {
    /** The current page, starting at 1. */
    readonly currentPage: number;

    /** The position of the last item on the current page, or 0 when there are no items. */
    readonly end: number;

    /** Goes to a page (clamped to the page range) and emits `pageChange`, as a click on a page button does. */
    goToPage(page: number): void;

    /** The number of items per page. */
    readonly pageSize: number;

    /** The page sizes offered by the page-size dropdown. */
    readonly pageSizes: readonly number[];

    /** Changes the page size through the cancelable `pageSizeChange` event, as the page-size dropdown does. `null` and values below 1 are ignored. */
    setPageSize(pageSize: number | null): void;

    /** The number of items before the current page. */
    readonly skip: number;

    /** The position of the first item on the current page, or 0 when there are no items. */
    readonly start: number;

    /** The total number of items. */
    readonly total: number;

    /** The total number of pages. */
    readonly totalPages: number;
}
