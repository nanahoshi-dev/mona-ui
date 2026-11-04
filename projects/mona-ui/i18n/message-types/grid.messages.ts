export interface MonaGridMessages {
    readonly all: string;
    readonly apply: string;
    readonly cancel: string;
    readonly cancelNewRow: string;
    cancelRowEdit(rowNumber: number): string;
    clearFilter(column: string): string;
    /** The name of the button that closes a row's detail row. */
    collapseDetail(rowNumber: number): string;
    /** Announced when the keyboard groups the grid by a column. */
    columnGrouped(column: string): string;
    /** Announced when the keyboard moves a column; the position counts visible columns from 1. */
    columnMoved(column: string, position: number): string;
    readonly columns: string;
    columnsSelected(count: number): string;
    readonly commandColumnTitle: string;
    readonly delete: string;
    deleteRowConfirmation(rowNumber: number): string;
    readonly deleteRowTitle: string;
    /** The name of the detail-toggle column's header. */
    readonly details: string;
    readonly dragColumnHeaderToGroup: string;
    readonly edit: string;
    editRow(rowNumber: number): string;
    /** The name of the button that opens a row's detail row. */
    expandDetail(rowNumber: number): string;
    readonly fieldValidationError?: string;
    filterByColumn(column: string): string;
    filterByColumnFiltered(column: string): string;
    filterOperator(column: string, operator: string): string;
    readonly filterPlaceholder: string;
    /** The name of a group indent column's header. */
    readonly group: string;
    /** Shown while the grid body loads. */
    readonly loading: string;
    readonly modified: string;
    readonly moveAsNext: string;
    readonly moveAsPrevious: string;
    readonly moveRow: string;
    readonly noData: string;
    readonly remove: string;
    removeRow(rowNumber: number): string;
    reorderRow(rowNumber: number): string;
    resizeColumn(column: string): string;
    readonly rowReorder: string;
    readonly rowReorderDisabled: string;
    readonly rowReorderDisabledEditing: string;
    readonly rowReorderDisabledFiltered: string;
    readonly rowReorderDisabledGrouped: string;
    readonly rowReorderDisabledServerBinding: string;
    readonly rowReorderDisabledSingleRow: string;
    readonly rowReorderDisabledSorted: string;
    readonly rowReorderDisabledVirtualScroll: string;
    rowReorderHandleAriaLabel(rowLabel: string, keyboardHint: string, disabledReason?: string): string;
    readonly rowReorderKeyboardHint: string;
    rowReorderMoved(fromRowNumber: number, toPosition: number): string;
    readonly rowValidationError: string;
    readonly save: string;
    readonly saveNewRow: string;
    saveRow(rowNumber: number): string;
    readonly selectAllRows: string;
    selectRow(rowNumber: number): string;
    /** Describes a header's place in a multi-column sort, from 1. */
    sortOrder(position: number): string;
    /** The accessible name of the toolbar above the grid. */
    readonly toolbar: string;
}
