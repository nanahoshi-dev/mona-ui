export interface RowReorderableOptions {
    /**
     * Determines whether an individual row may be reordered.
     *
     * Rows for which this returns false must show a disabled handle.
     */
    canReorder?: (rowData: Record<PropertyKey, unknown>) => boolean;

    /**
     * Enables row reordering.
     *
     * @default true when the directive is used without a value
     */
    enabled?: boolean;

    /**
     * Returns the accessible label for a row's reorder handle.
     *
     * The default must be positional, such as:
     * "Reorder row 3"
     */
    rowAriaLabel?: (rowData: Record<PropertyKey, unknown>, absoluteIndex: number) => string;
}
