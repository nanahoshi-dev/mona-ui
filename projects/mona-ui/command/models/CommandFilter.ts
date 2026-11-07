/** What a filter sees of an item. */
export interface CommandFilterItem {
    /** Other words the item should be found by. */
    readonly keywords: readonly string[];
    /** The item's value. */
    readonly value: string;
}

/**
 * Decides whether an item stays in the list for a query. It's only called while the query isn't empty.
 * @param query the query, trimmed
 * @param item the item to test
 */
export type CommandFilter = (query: string, item: CommandFilterItem) => boolean;

/**
 * Who decides which items show. `"auto"` filters them on the client. `"manual"` shows every item, for results the
 * consumer already narrowed down, such as a server's.
 */
export type CommandFilterMode = "auto" | "manual";
