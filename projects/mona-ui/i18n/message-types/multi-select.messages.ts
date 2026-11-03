export interface MonaMultiSelectMessages {
    readonly clear: string;
    readonly itemsCount: (count: number) => string;
    readonly removeMoreItems: (count: number) => string;
}
