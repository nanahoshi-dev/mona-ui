export interface PagerSettings {
    /** Whether the pager is active. */
    enabled: boolean;
    /** Whether first/last page buttons are shown. */
    firstLast: boolean;
    /** Number of items shown per page. */
    pageSize: number;
    /** Page size options shown in the pager, or `false`/`true` to hide/show a default set. */
    pageSizeValues: number[] | boolean;
    /** Whether previous/next page buttons are shown. */
    previousNext: boolean;
    /** Whether a page summary (e.g. "1-10 of 50") is shown. */
    showInfo: boolean;
    /** Whether pages are selected via numbered buttons or a page-number input. */
    type: "numeric" | "input";
    /** Number of numeric page buttons shown at once, when `type` is `"numeric"`. */
    visiblePages: number;
}
