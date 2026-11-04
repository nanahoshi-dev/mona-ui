/**
 * The context of a `monaListViewGroupHeaderTemplate`: the group's value (what `groupBy` returned for its items), as
 * `let-group`.
 */
export interface ListViewGroupHeaderTemplateContext<G = unknown> {
    readonly $implicit: G;
}
