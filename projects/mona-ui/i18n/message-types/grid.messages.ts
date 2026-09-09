export interface MonaGridMessages {
    readonly apply: string;
    readonly cancel: string;
    readonly cancelRowEdit: string;
    readonly columns: string;
    columnsSelected(count: number): string;
    readonly delete: string;
    readonly deleteRowConfirmation: string;
    readonly deleteRowTitle: string;
    readonly dragColumnHeaderToGroup: string;
    readonly edit: string;
    readonly editRow: string;
    readonly modified: string;
    readonly moveAsNext: string;
    readonly moveAsPrevious: string;
    readonly moveRow: string;
    readonly noData: string;
    readonly remove: string;
    readonly removeRow: string;
    reorderRow(rowNumber: number): string;
    readonly rowReorder: string;
    readonly rowReorderKeyboardHint: string;
    readonly rowValidationError: string;
    readonly save: string;
    readonly saveRow: string;
    readonly selectAllRows: string;
}
