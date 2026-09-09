export interface MonaGridMessages {
    readonly apply: string;
    readonly cancel: string;
    readonly cancelRowEdit: string;
    columnsSelected(count: number): string;
    readonly delete: string;
    readonly deleteRowConfirmation: string;
    readonly deleteRowTitle: string;
    readonly edit: string;
    readonly editRow: string;
    readonly noData: string;
    readonly remove: string;
    readonly removeRow: string;
    reorderRow(rowNumber: number): string;
    readonly rowReorder: string;
    readonly rowReorderKeyboardHint: string;
    readonly rowValidationError: string;
    readonly save: string;
    readonly saveRow: string;
}
