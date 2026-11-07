export type FilterOperator = "contains" | "endsWith" | "startsWith" | ((value: string, filter: string) => boolean);

export interface FilterableOptions {
    /** Whether text matching is case-sensitive. */
    caseSensitive: boolean;
    /** Milliseconds to wait after the last keystroke before applying the filter. */
    debounce: number;
    /** Whether filtering is active. */
    enabled: boolean;
    /** Match strategy used to test an option's text against the filter text. */
    operator: FilterOperator;
}
