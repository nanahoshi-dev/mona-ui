/**
 * The context of a `monaListBoxItemTemplate`: the data item, as `let-item`.
 */
export interface ListBoxItemTemplateContext<T = unknown> {
    readonly $implicit: T;
}
