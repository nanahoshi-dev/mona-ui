import type { KanbanColumn } from "./KanbanColumn";

/** The context of a `monaKanbanCardTemplate`: the card, as `let-card`. */
export interface KanbanCardTemplateContext<T = unknown> {
    /** The card (`let-card`). */
    readonly $implicit: T;
    /** The column the card is in (`let-column="column"`). */
    readonly column: KanbanColumn;
    /** The card's index in its column (`let-index="index"`). */
    readonly index: number;
}

/** The context of a `monaKanbanColumnHeaderTemplate` or `monaKanbanColumnFooterTemplate`: the column, as `let-column`. */
export interface KanbanColumnTemplateContext<T = unknown> {
    /** The column (`let-column`). */
    readonly $implicit: KanbanColumn;
    /** The column's cards, in order (`let-cards="cards"`). */
    readonly cards: readonly T[];
    /** How many cards the column holds (`let-count="count"`). */
    readonly count: number;
}
