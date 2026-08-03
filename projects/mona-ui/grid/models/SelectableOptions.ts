export interface SelectableOptions {
    /**
     * Enables row selection.
     */
    enabled?: boolean;

    /**
     * Controls whether one or multiple rows can be selected.
     *
     * @default "single"
     */
    mode?: "single" | "multiple";

    /**
     * Determines which rows are affected by the header checkbox.
     *
     * - "page": rows on the current paginated page
     * - "view": all rows in the current filtered and sorted view
     *
     * For virtual scrolling, "page" resolves to the complete current view
     * because virtual scrolling does not have logical pages.
     *
     * @default "page"
     */
    selectAllScope?: "page" | "view";

    /**
     * Whether clicking the row itself changes selection.
     *
     * Set this to false when selection should only be changed through
     * checkboxes or application code.
     *
     * @default true
     */
    selectOnRowClick?: boolean;

    /**
     * Displays the built-in checkbox selection column.
     *
     * @default false
     */
    showCheckboxes?: boolean;

    /**
     * Displays a select-all checkbox in the selection-column header.
     *
     * Only applies to multiple-selection mode.
     *
     * @default true
     */
    showSelectAll?: boolean;
}
