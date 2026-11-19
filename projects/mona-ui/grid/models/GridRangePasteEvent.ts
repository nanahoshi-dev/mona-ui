/** One row's pasted values: the row as it was, and as it is with the values in. */
export interface GridRangePasteChange<T = Record<PropertyKey, unknown>> {
    /** The fields that took a pasted value. */
    readonly fields: readonly string[];
    readonly originalRowData: T;
    /** A copy of the row with the pasted values; save it to change the grid's data. */
    readonly rowData: T;
}

/** What a paste into the grid's cells would change. The grid doesn't change its data itself. */
export interface GridRangePasteEvent<T = Record<PropertyKey, unknown>> {
    /** The rows that take pasted values, in the order the grid shows them. */
    readonly changes: readonly GridRangePasteChange<T>[];
    /** How many cells kept their value: their column can't be edited, or the text doesn't fit its type. */
    readonly skippedCells: number;
    /** The pasted text, as it came from the clipboard. */
    readonly text: string;
}
