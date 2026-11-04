export interface MonaListMessages {
    readonly filterList: string;

    /** Status text while a list view is loading. */
    readonly loading: string;

    readonly noData: string;

    /** Accessible name of a list view's pager, from the list's name ("People pagination"). */
    pagerLabel(list: string): string;
}
