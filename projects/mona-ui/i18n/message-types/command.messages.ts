export interface MonaCommandMessages {
    readonly dialogLabel: string;
    readonly inputLabel: string;
    readonly listLabel: string;
    readonly loading: string;
    readonly noResults: string;
    readonly placeholder: string;
    readonly resultsAvailable: (count: number) => string;
}
