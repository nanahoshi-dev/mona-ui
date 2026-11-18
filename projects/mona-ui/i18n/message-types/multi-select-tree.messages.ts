export interface MonaMultiSelectTreeMessages {
    readonly clear: string;
    readonly itemsCount: (count: number) => string;
    readonly removeMoreItems: (count: number) => string;
}
