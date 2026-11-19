export interface MonaSortableMessages {
    /** Announced after an item moves within its list, with its name and new position ("Draft moved to position 2 of 5"). */
    itemMoved(item: string, position: number, total: number): string;

    /**
     * Announced after an item moves to another list, with its name, the list's name and its position there ("Draft moved
     * to Done, position 1 of 3").
     */
    itemMovedToList(item: string, list: string, position: number, total: number): string;
}
