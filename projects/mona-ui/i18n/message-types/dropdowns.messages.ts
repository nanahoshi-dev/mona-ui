export interface MonaDropdownsMessages {
    /** The button that closes a dropdown's popup when it opens as a bottom sheet on a small screen. */
    readonly close: string;
    readonly itemPosition: (text: string, position: number, total: number) => string;
    readonly noResultsFound: string;
    readonly resultsAvailable: (count: number) => string;
}
