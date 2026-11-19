/** A body cell, by its row's uid and its column's id. */
export interface GridCellAddress {
    readonly columnId: string;
    readonly rowUid: string;
}

/** A range of cells from where the selection started (`anchor`) to where it was extended to (`focus`). */
export interface GridCellRangeState {
    readonly anchor: GridCellAddress;
    readonly focus: GridCellAddress;
}

/**
 * The cells a range selection covers: the data items of its rows and the fields of its columns, each in the order
 * the grid shows them.
 */
export interface GridCellRange<T = Record<PropertyKey, unknown>> {
    readonly fields: readonly string[];
    readonly rows: readonly T[];
}
