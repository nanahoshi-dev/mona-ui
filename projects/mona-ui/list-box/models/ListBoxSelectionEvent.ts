// `any` by default, so an event annotated without a type argument keeps untyped items.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ListBoxSelectionEvent<T = any> {
    /** Items that were deselected (read-only). */
    readonly deselectedItems: T[];
    /** Items that are now selected (read-only). */
    readonly selectedItems: T[];
}
