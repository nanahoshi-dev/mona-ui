/** The context of a `monaListViewItemTemplate`: the data item, as `let-item`. */
export interface ListViewItemTemplateContext<T = unknown> {
    readonly $implicit: T;
}
