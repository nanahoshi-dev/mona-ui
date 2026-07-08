export interface InfoTemplateContext {
    /** The current page number. */
    currentPage: number;

    /** The number of items per page. */
    pageSize: number;

    /** The number of items to skip. */
    skip: number;

    /** The total number of items. */
    total: number;

    /** The total number of pages. */
    totalPages: number;
}
