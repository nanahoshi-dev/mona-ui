// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaGridMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

export const GRID_DEFAULT_MESSAGES = {
    all: "(All)",
    apply: "Apply",
    cancel: "Cancel",
    cancelNewRow: "Cancel new row",
    cancelRowEdit: (rowNumber: number) => `Cancel editing row ${localizeNumber(rowNumber)}`,
    clearFilter: (column: string) => `Clear filter for ${column}`,
    collapseDetail: (rowNumber: number) => `Collapse details of row ${localizeNumber(rowNumber)}`,
    columnGrouped: (column: string) => `Grouped by ${column}`,
    columnMoved: (column: string, position: number) => `${column} moved to position ${localizeNumber(position)}`,
    columns: "Columns",
    columnsSelected: (count: number) => `${localizeNumber(count)} selected columns`,
    delete: "Delete",
    deleteRowConfirmation: (rowNumber: number) => `Are you sure you want to delete row ${localizeNumber(rowNumber)}?`,
    deleteRowTitle: "Delete row?",
    details: "Details",
    dragColumnHeaderToGroup: "Drag a column header here to group",
    edit: "Edit",
    editRow: (rowNumber: number) => `Edit row ${localizeNumber(rowNumber)}`,
    expandDetail: (rowNumber: number) => `Expand details of row ${localizeNumber(rowNumber)}`,
    fieldValidationError: "Invalid value.",
    filterByColumn: (column: string) => `Filter by ${column}`,
    filterByColumnFiltered: (column: string) => `Filter by ${column}, filtered`,
    filterOperator: (column: string, operator: string) => `Filter operator for ${column}: ${operator}`,
    filterPlaceholder: "Filter...",
    group: "Group",
    loading: "Loading",
    modified: "Modified",
    moveAsNext: "Move as next",
    moveAsPrevious: "Move as previous",
    moveRow: "Move row",
    noData: "No data",
    remove: "Remove",
    removeRow: (rowNumber: number) => `Remove row ${localizeNumber(rowNumber)}`,
    reorderRow: (rowNumber: number) => `Reorder row ${localizeNumber(rowNumber)}`,
    resizeColumn: (column: string) => `Resize ${column}`,
    rowReorder: "Row reorder",
    rowReorderDisabled: "Row reordering is disabled.",
    rowReorderDisabledEditing: "Finish editing to reorder rows.",
    rowReorderDisabledFiltered: "Clear filters to reorder rows.",
    rowReorderDisabledGrouped: "Clear grouping to reorder rows.",
    rowReorderDisabledServerBinding: "Row reordering isn't available with server binding.",
    rowReorderDisabledSingleRow: "At least two rows are needed to reorder.",
    rowReorderDisabledSorted: "Clear sorting to reorder rows.",
    rowReorderDisabledVirtualScroll: "Row reordering isn't available while virtual scrolling is enabled.",
    rowReorderHandleAriaLabel: (rowLabel: string, keyboardHint: string, disabledReason?: string) =>
        `${rowLabel}. ${keyboardHint}${disabledReason ? ` ${disabledReason}` : ""}`,
    rowReorderKeyboardHint: "Use Alt plus Up Arrow or Alt plus Down Arrow to move.",
    rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
        `Moved row ${localizeNumber(fromRowNumber)} to position ${localizeNumber(toPosition)}.`,
    rowValidationError: "This row has validation errors.",
    save: "Save",
    saveNewRow: "Save new row",
    saveRow: (rowNumber: number) => `Save row ${localizeNumber(rowNumber)}`,
    selectAllRows: "Select all rows",
    selectRow: (rowNumber: number) => `Select row ${localizeNumber(rowNumber)}`,
    sortOrder: (position: number) => `Sort order ${localizeNumber(position)}`,
    toolbar: "Grid toolbar"
} satisfies MonaGridMessages;
