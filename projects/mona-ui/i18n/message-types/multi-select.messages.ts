export interface MonaMultiSelectMessages {
    readonly clear: string;
    readonly itemsCount: (count: number) => string;
    readonly removeMoreItems: (count: number) => string;
    /** The option at the top of the list that selects every item shown, or clears them when they're all selected. */
    readonly selectAll: string;
}
