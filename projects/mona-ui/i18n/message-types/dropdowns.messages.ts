export interface MonaDropdownsMessages {
    readonly itemPosition: (text: string, position: number, total: number) => string;
    readonly noResultsFound: string;
    readonly resultsAvailable: (count: number) => string;
}
