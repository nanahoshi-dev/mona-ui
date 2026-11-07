export interface SortableOptions {
    /** Whether a third click on a sorted column clears its sort. */
    allowUnsort?: boolean;
    /** Whether sorting is active. On unless set to `false`; options replace earlier ones. */
    enabled?: boolean;
    /** Whether one or several columns can be sorted at once. */
    mode?: "single" | "multiple";
    /** Whether sort order indices are displayed on header cells. */
    showIndices?: boolean;
}
