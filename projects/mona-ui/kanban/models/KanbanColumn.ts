/** A column of a Kanban board: the cards whose status field holds its `status`. */
export interface KanbanColumn {
    /**
     * The most cards the column takes. Once it holds that many, cards from other columns can't move into it, and its
     * count is highlighted. Without it, the column takes any number.
     */
    readonly limit?: number;

    /** The value of a card's status field that puts the card in this column. */
    readonly status: unknown;

    /** The column's title, which also names it in announcements. */
    readonly title: string;
}
