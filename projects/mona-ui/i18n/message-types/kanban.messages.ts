export interface MonaKanbanMessages {
    /** How many cards a column holds, read after its title ("3 cards"). */
    cardCount(count: number): string;

    /** How many cards a column with a limit holds, read after its title ("3 of 5 cards"). */
    cardCountWithLimit(count: number, limit: number): string;

    /** Shown in a column with no cards. */
    readonly emptyColumn: string;
}
