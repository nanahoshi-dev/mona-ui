/**
 * The context of a `monaListBoxItemTemplate`: the data item, as `let-item`.
 */
export interface ListBoxItemTemplateContext<T = unknown> {
    /** The raw data item being rendered. */
    readonly $implicit: T;
}
