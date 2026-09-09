import type { MonaGridMessages } from "@nanahoshi/mona-ui/i18n";

export const GRID_DEFAULT_MESSAGES = {
    apply: "Apply",
    cancel: "Cancel",
    cancelRowEdit: "Cancel row edit",
    columns: "Columns",
    columnsSelected: (count: number) => `${count} selected columns`,
    delete: "Delete",
    deleteRowConfirmation: "Are you sure you want to delete this item?",
    deleteRowTitle: "Delete row?",
    dragColumnHeaderToGroup: "Drag a column header here to group",
    edit: "Edit",
    editRow: "Edit row",
    modified: "Modified",
    moveAsNext: "Move as next",
    moveAsPrevious: "Move as previous",
    moveRow: "Move row",
    noData: "No data",
    remove: "Remove",
    removeRow: "Remove row",
    reorderRow: (rowNumber: number) => `Reorder row ${rowNumber}`,
    rowReorder: "Row reorder",
    rowReorderKeyboardHint: "Use Alt plus Up Arrow or Alt plus Down Arrow to move.",
    rowValidationError: "This row has validation errors.",
    save: "Save",
    saveRow: "Save row",
    selectAllRows: "Select all rows"
} satisfies MonaGridMessages;
