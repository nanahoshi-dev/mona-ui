export interface MonaPagerMessages {
    readonly firstPageLabel: string;

    /** Accessible name of the page-size dropdown. */
    readonly itemsPerPageLabel: string;

    jumpBackwardLabel(pages: number): string;
    jumpForwardLabel(pages: number): string;

    readonly lastPageLabel: string;
    readonly nextPageLabel: string;

    /** @deprecated No longer rendered; input mode uses {@link pageInputPrefix} and {@link pageInputSuffix}. */
    readonly ofText: string;

    /** Text before the page input in input mode ("Page" in "Page [3] of 10"). */
    pageInputPrefix(totalPages: number): string;

    /** Text after the page input in input mode ("of 10" in "Page [3] of 10"). */
    pageInputSuffix(totalPages: number): string;

    pageLabel(page: number): string;

    /** Accessible name of the page input and of the page dropdown shown on narrow pagers. */
    readonly pageSelectLabel: string;

    pageSizeLabel(pageSize: number): string;
    pageStatus(page: number, totalPages: number): string;

    /** @deprecated No longer rendered; input mode uses {@link pageInputPrefix} and {@link pageInputSuffix}. */
    readonly pageText: string;

    /** Accessible name of the pager's navigation landmark. */
    readonly pagerLabel: string;

    readonly previousPageLabel: string;

    rangeStatus(start: number, end: number, total: number): string;
}
