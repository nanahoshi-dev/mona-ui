/** The context of a `monaListViewItemTemplate`: the data item, as `let-item`. */
export interface ListViewItemTemplateContext<T = unknown> {
    /** The data item (`let-item`), or the group's value (`let-group`). */
    readonly $implicit: T;
}
