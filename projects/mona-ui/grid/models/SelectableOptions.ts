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
     * Derives the accessible label for a row's selection checkbox from its data.
     *
     * When omitted, the checkbox falls back to a positional label (e.g. "Select row 3").
     */
    rowAriaLabel?: (rowData: Record<PropertyKey, unknown>) => string;

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
     * Off by default so that clicking a row to interact with its content (a link, a button,
     * an editable cell) never silently discards the current selection. Set this to true to
     * also select rows via a plain click, in addition to checkboxes or application code.
     *
     * @default false
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
